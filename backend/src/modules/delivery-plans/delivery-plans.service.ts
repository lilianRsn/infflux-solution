import type { PoolClient } from "pg";
import pool from "../../infrastructure/database/db";
import { AppError } from "../../common/errors/app-error";
import { ReprogramOrderBody } from "./delivery-plans.types";

type Priority = "urgent" | "standard" | "flexible";
type PlanningBlockReason =
  | "INSUFFICIENT_CLIENT_STORAGE"
  | "INSUFFICIENT_DOCK_CAPACITY"
  | "NO_AVAILABLE_TRUCK"
  | "TRUCK_CAPACITY_TOO_LOW";

type PlanningIssue = PlanningBlockReason | "REMAINING_PALLETS_NOT_SCHEDULED";

type TruckRow = {
  id: string;
  name: string;
  license_plate: string;
  max_palettes: number;
  max_volume_m3: number;
  max_weight_kg: number;
  status: "AVAILABLE" | "ON_ROUTE" | "LOADING" | "MAINTENANCE";
};

type DockRow = {
  id: string;
  code: string;
  side: "N" | "S" | "E" | "W";
  position_x: number;
  position_y: number;
  status: "FREE" | "OCCUPIED" | "MAINTENANCE";
};

function getPriorityScore(priority: Priority) {
  if (priority === "urgent") return 100;
  if (priority === "standard") return 60;
  return 20;
}

function getServiceLevel(priority: Priority) {
  if (priority === "urgent") return "priority";
  if (priority === "standard") return "standard";
  return "optimized";
}

function addDaysToDateString(dateInput: string | Date, days: number) {
  const date =
    typeof dateInput === "string"
      ? new Date(`${dateInput}T00:00:00.000Z`)
      : new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    throw new AppError("Invalid requested delivery date", 400);
  }

  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
}

function getMaxTruckCapacityForSlot(
  availableTrucks: TruckRow[],
  availableDockCount: number
) {
  return [...availableTrucks]
    .sort((a, b) => Number(b.max_palettes) - Number(a.max_palettes))
    .slice(0, availableDockCount)
    .reduce((sum, truck) => sum + Number(truck.max_palettes), 0);
}

function selectTrucks(
  availableTrucks: TruckRow[],
  totalPallets: number,
  availableDockCount: number
) {
  if (availableDockCount <= 0) {
    return {
      selected: [] as Array<{ truck: TruckRow; assignedPallets: number }>,
      reason: "INSUFFICIENT_DOCK_CAPACITY" as PlanningBlockReason
    };
  }

  const sorted = [...availableTrucks].sort(
    (a, b) => Number(b.max_palettes) - Number(a.max_palettes)
  );
  const dockLimited = sorted.slice(0, availableDockCount);

  const totalAllTruckCapacity = sorted.reduce(
    (sum, truck) => sum + Number(truck.max_palettes),
    0
  );
  const totalDockLimitedCapacity = dockLimited.reduce(
    (sum, truck) => sum + Number(truck.max_palettes),
    0
  );

  if (totalAllTruckCapacity < totalPallets) {
    return {
      selected: [] as Array<{ truck: TruckRow; assignedPallets: number }>,
      reason: "NO_AVAILABLE_TRUCK" as PlanningBlockReason
    };
  }

  if (totalDockLimitedCapacity < totalPallets) {
    return {
      selected: [] as Array<{ truck: TruckRow; assignedPallets: number }>,
      reason: "INSUFFICIENT_DOCK_CAPACITY" as PlanningBlockReason
    };
  }

  let remaining = totalPallets;
  const selected: Array<{ truck: TruckRow; assignedPallets: number }> = [];

  for (const truck of dockLimited) {
    if (remaining <= 0) break;

    const assignedPallets = Math.min(Number(truck.max_palettes), remaining);
    if (assignedPallets > 0) {
      selected.push({ truck, assignedPallets });
      remaining -= assignedPallets;
    }
  }

  if (remaining > 0) {
    return {
      selected: [] as Array<{ truck: TruckRow; assignedPallets: number }>,
      reason: "TRUCK_CAPACITY_TOO_LOW" as PlanningBlockReason
    };
  }

  return { selected, reason: null as PlanningBlockReason | null };
}

async function getWarehousePlanningConstraints(
  dbClient: PoolClient,
  clientWarehouseId: string,
  plannedDate: string
) {
  const capacityResult = await dbClient.query(
    `
    SELECT
      COALESCE((
        SELECT SUM(ss.total_pallets)
        FROM warehouse_floors wf
        JOIN warehouse_aisles wa ON wa.floor_id = wf.id
        JOIN storage_slots ss ON ss.aisle_id = wa.id
        WHERE wf.client_warehouse_id = $1
      ), 0) AS max_capacity_pallets,
      COALESCE((
        SELECT SUM(ss.used_pallets)
        FROM warehouse_floors wf
        JOIN warehouse_aisles wa ON wa.floor_id = wf.id
        JOIN storage_slots ss ON ss.aisle_id = wa.id
        WHERE wf.client_warehouse_id = $1
      ), 0) AS used_pallets
    `,
    [clientWarehouseId]
  );

  const reservedResult = await dbClient.query(
    `
    SELECT COALESCE(SUM(total_pallets), 0) AS reserved_pallets
    FROM delivery_plans
    WHERE client_warehouse_id = $1
      AND planned_delivery_date = $2
      AND status IN ('DRAFT', 'CONFIRMED', 'IN_PROGRESS')
    `,
    [clientWarehouseId, plannedDate]
  );

  const capacity = capacityResult.rows[0];
  const reserved = reservedResult.rows[0];

  const maxCapacityPallets = Number(capacity.max_capacity_pallets ?? 0);
  const usedPallets = Number(capacity.used_pallets ?? 0);
  const reservedPallets = Number(reserved.reserved_pallets ?? 0);

  return {
    maxCapacityPallets,
    usedPallets,
    reservedPallets,
    remainingStoragePallets: maxCapacityPallets - usedPallets - reservedPallets
  };
}

async function getAvailableTrucksForSlot(
  dbClient: PoolClient,
  plannedDate: string,
  plannedTimeWindow: "morning" | "afternoon" | "full_day"
) {
  const result = await dbClient.query(
    `
    SELECT *
    FROM trucks
    WHERE status = 'AVAILABLE'
      AND id NOT IN (
        SELECT dpt.truck_id
        FROM delivery_plan_trucks dpt
        JOIN delivery_plans dp ON dp.id = dpt.delivery_plan_id
        WHERE dp.planned_delivery_date = $1
          AND dp.status IN ('DRAFT', 'CONFIRMED', 'IN_PROGRESS')
          AND (
            dp.planned_time_window = 'full_day'
            OR $2 = 'full_day'
            OR dp.planned_time_window = $2
          )
      )
    ORDER BY max_palettes DESC, name ASC
    `,
    [plannedDate, plannedTimeWindow]
  );

  return result.rows as TruckRow[];
}

async function getAvailableDocksForSlot(
  dbClient: PoolClient,
  clientWarehouseId: string,
  plannedDate: string,
  plannedTimeWindow: "morning" | "afternoon" | "full_day"
) {
  const result = await dbClient.query(
    `
    SELECT ld.*
    FROM loading_docks ld
    WHERE ld.client_warehouse_id = $1
      AND ld.status <> 'MAINTENANCE'
      AND ld.id NOT IN (
        SELECT dpd.loading_dock_id
        FROM delivery_plan_docks dpd
        JOIN delivery_plans dp ON dp.id = dpd.delivery_plan_id
        WHERE dp.planned_delivery_date = $2
          AND dp.status IN ('DRAFT', 'CONFIRMED', 'IN_PROGRESS')
          AND (
            dp.planned_time_window = 'full_day'
            OR $3 = 'full_day'
            OR dp.planned_time_window = $3
          )
      )
    ORDER BY ld.code ASC
    `,
    [clientWarehouseId, plannedDate, plannedTimeWindow]
  );

  return result.rows as DockRow[];
}

async function generateDeliveryPlansInternal(orderIds?: string[]) {
  const dbClient = await pool.connect();

  try {
    await dbClient.query("BEGIN");

    const filters: string[] = ["o.planning_status = 'UNPLANNED'"];
    const params: unknown[] = [];

    if (orderIds && orderIds.length > 0) {
      params.push(orderIds);
      filters.push(`o.id = ANY($${params.length}::uuid[])`);
    }

    const ordersResult = await dbClient.query(
      `
      SELECT
        o.*,
        cw.name AS client_warehouse_name
      FROM orders o
      JOIN client_warehouses cw ON cw.id = o.client_warehouse_id
      WHERE ${filters.join(" AND ")}
      ORDER BY
        CASE o.urgency_level
          WHEN 'urgent' THEN 0
          WHEN 'standard' THEN 1
          ELSE 2
        END,
        o.requested_delivery_date ASC,
        o.created_at ASC
      `,
      params
    );

    const generatedPlans: Array<{
      delivery_plan_id: string;
      order_id: string;
      order_number: string;
      allocated_pallets: number;
      trucks: string[];
      assigned_docks: string[];
      planned_delivery_date: string;
      planned_time_window: "morning" | "afternoon" | "full_day";
    }> = [];

    const blockedOrders: Array<{
      order_id: string;
      order_number: string;
      blocked_reason: PlanningIssue;
    }> = [];

    const partiallyPlannedOrders: Array<{
      order_id: string;
      order_number: string;
      remaining_pallets: number;
      blocked_reason: PlanningIssue;
    }> = [];

    for (const order of ordersResult.rows) {
      let remainingPallets = Number(order.total_pallets);
      let firstPlannedDate: string | null = null;
      let allocationsCreated = 0;
      let lastIssue: PlanningIssue = "NO_AVAILABLE_TRUCK";

      const splitAllowed = Boolean(order.split_delivery_allowed);
      const planningHorizonDays = splitAllowed ? 7 : 1;

      for (
        let dayOffset = 0;
        dayOffset < planningHorizonDays && remainingPallets > 0;
        dayOffset++
      ) {
        const plannedDate = addDaysToDateString(order.requested_delivery_date, dayOffset);
        const plannedTimeWindow = order.delivery_time_window as
          | "morning"
          | "afternoon"
          | "full_day";

        const constraints = await getWarehousePlanningConstraints(
          dbClient,
          order.client_warehouse_id,
          plannedDate
        );

        if (constraints.remainingStoragePallets <= 0) {
          lastIssue = "INSUFFICIENT_CLIENT_STORAGE";
          continue;
        }

        const availableDocks = await getAvailableDocksForSlot(
          dbClient,
          order.client_warehouse_id,
          plannedDate,
          plannedTimeWindow
        );

        if (!availableDocks.length) {
          lastIssue = "INSUFFICIENT_DOCK_CAPACITY";
          continue;
        }

        const availableTrucks = await getAvailableTrucksForSlot(
          dbClient,
          plannedDate,
          plannedTimeWindow
        );

        if (!availableTrucks.length) {
          lastIssue = "NO_AVAILABLE_TRUCK";
          continue;
        }

        const maxTruckCapacityForSlot = getMaxTruckCapacityForSlot(
          availableTrucks,
          availableDocks.length
        );

        if (maxTruckCapacityForSlot <= 0) {
          lastIssue = "INSUFFICIENT_DOCK_CAPACITY";
          continue;
        }

        const palletsToAllocate = splitAllowed
          ? Math.min(
              remainingPallets,
              constraints.remainingStoragePallets,
              maxTruckCapacityForSlot
            )
          : remainingPallets;

        if (palletsToAllocate <= 0) {
          lastIssue = "INSUFFICIENT_CLIENT_STORAGE";
          continue;
        }

        const selection = selectTrucks(
          availableTrucks,
          palletsToAllocate,
          availableDocks.length
        );

        if (selection.reason) {
          lastIssue = selection.reason;
          if (!splitAllowed) break;
          continue;
        }

        const deliveryPlanResult = await dbClient.query(
          `
          INSERT INTO delivery_plans (
            planned_delivery_date,
            planned_time_window,
            client_warehouse_id,
            status,
            total_pallets,
            total_volume_m3,
            priority_score
          )
          VALUES ($1, $2, $3, 'DRAFT', $4, 0, $5)
          RETURNING *
          `,
          [
            plannedDate,
            plannedTimeWindow,
            order.client_warehouse_id,
            palletsToAllocate,
            getPriorityScore(order.urgency_level as Priority)
          ]
        );

        const deliveryPlan = deliveryPlanResult.rows[0];

        await dbClient.query(
          `
          INSERT INTO delivery_plan_orders (delivery_plan_id, order_id, allocated_pallets)
          VALUES ($1, $2, $3)
          `,
          [deliveryPlan.id, order.id, palletsToAllocate]
        );

        const assignedDockCodes: string[] = [];

        for (let index = 0; index < selection.selected.length; index++) {
          const { truck, assignedPallets } = selection.selected[index];
          const dock = availableDocks[index];

          await dbClient.query(
            `
            INSERT INTO delivery_plan_trucks (
              delivery_plan_id,
              truck_id,
              assigned_pallets,
              assigned_volume_m3
            )
            VALUES ($1, $2, $3, 0)
            `,
            [deliveryPlan.id, truck.id, assignedPallets]
          );

          await dbClient.query(
            `
            INSERT INTO delivery_plan_docks (
              delivery_plan_id,
              loading_dock_id,
              truck_id
            )
            VALUES ($1, $2, $3)
            `,
            [deliveryPlan.id, dock.id, truck.id]
          );

          assignedDockCodes.push(dock.code);
        }

        generatedPlans.push({
          delivery_plan_id: deliveryPlan.id,
          order_id: order.id,
          order_number: order.order_number,
          allocated_pallets: palletsToAllocate,
          trucks: selection.selected.map((item) => item.truck.name),
          assigned_docks: assignedDockCodes,
          planned_delivery_date: plannedDate,
          planned_time_window: plannedTimeWindow
        });

        remainingPallets -= palletsToAllocate;
        allocationsCreated += 1;

        if (!firstPlannedDate) {
          firstPlannedDate = plannedDate;
        }

        if (!splitAllowed) {
          break;
        }
      }

      if (remainingPallets === 0) {
        await dbClient.query(
          `
          UPDATE orders
          SET planning_status = 'PLANNED',
              blocked_reason = NULL,
              planned_delivery_date = $2
          WHERE id = $1
          `,
          [order.id, firstPlannedDate]
        );

        continue;
      }

      if (allocationsCreated > 0) {
        await dbClient.query(
          `
          UPDATE orders
          SET planning_status = 'PARTIALLY_PLANNED',
              blocked_reason = 'REMAINING_PALLETS_NOT_SCHEDULED',
              planned_delivery_date = $2
          WHERE id = $1
          `,
          [order.id, firstPlannedDate]
        );

        partiallyPlannedOrders.push({
          order_id: order.id,
          order_number: order.order_number,
          remaining_pallets: remainingPallets,
          blocked_reason: "REMAINING_PALLETS_NOT_SCHEDULED"
        });

        continue;
      }

      await dbClient.query(
        `
        UPDATE orders
        SET planning_status = 'BLOCKED',
            blocked_reason = $2
        WHERE id = $1
        `,
        [order.id, lastIssue]
      );

      blockedOrders.push({
        order_id: order.id,
        order_number: order.order_number,
        blocked_reason: lastIssue
      });
    }

    await dbClient.query("COMMIT");

    return {
      generated_count: generatedPlans.length,
      blocked_count: blockedOrders.length,
      partially_planned_count: partiallyPlannedOrders.length,
      generated_plans: generatedPlans,
      blocked_orders: blockedOrders,
      partially_planned_orders: partiallyPlannedOrders
    };
  } catch (error) {
    await dbClient.query("ROLLBACK");
    throw error;
  } finally {
    dbClient.release();
  }
}

async function cleanupExistingPlansForOrder(dbClient: PoolClient, orderId: string) {
  const plansResult = await dbClient.query(
    `
    SELECT
      dp.id,
      dp.status,
      COUNT(DISTINCT dpo_all.order_id) AS orders_count
    FROM delivery_plan_orders dpo
    JOIN delivery_plans dp ON dp.id = dpo.delivery_plan_id
    JOIN delivery_plan_orders dpo_all ON dpo_all.delivery_plan_id = dp.id
    WHERE dpo.order_id = $1
    GROUP BY dp.id, dp.status
    `,
    [orderId]
  );

  if (!plansResult.rows.length) {
    return;
  }

  for (const plan of plansResult.rows) {
    if (Number(plan.orders_count) > 1) {
      throw new AppError(
        "Cannot reprogram grouped delivery plans with this route yet",
        400
      );
    }

    if (plan.status === "IN_PROGRESS" || plan.status === "COMPLETED") {
      throw new AppError(
        "Cannot reprogram an order linked to an in-progress or completed delivery",
        400
      );
    }
  }

  const planIds = plansResult.rows.map((row) => row.id as string);

  await dbClient.query(
    `
    DELETE FROM delivery_plans
    WHERE id = ANY($1::uuid[])
    `,
    [planIds]
  );
}

export async function generateDeliveryPlans() {
  return generateDeliveryPlansInternal();
}

export async function listDeliveryPlans() {
  const result = await pool.query(
    `
    SELECT
      dp.*,
      cw.name AS client_warehouse_name,
      COUNT(DISTINCT dpo.order_id) AS orders_count,
      COUNT(DISTINCT dpt.truck_id) AS trucks_count,
      COUNT(DISTINCT dpd.loading_dock_id) AS docks_count
    FROM delivery_plans dp
    JOIN client_warehouses cw ON cw.id = dp.client_warehouse_id
    LEFT JOIN delivery_plan_orders dpo ON dpo.delivery_plan_id = dp.id
    LEFT JOIN delivery_plan_trucks dpt ON dpt.delivery_plan_id = dp.id
    LEFT JOIN delivery_plan_docks dpd ON dpd.delivery_plan_id = dp.id
    GROUP BY dp.id, cw.name
    ORDER BY dp.planned_delivery_date ASC, dp.created_at DESC
    `
  );

  return result.rows;
}

export async function getDeliveryPlanById(planId: string) {
  const planResult = await pool.query(
    `
    SELECT
      dp.*,
      cw.name AS client_warehouse_name,
      cw.address AS client_warehouse_address
    FROM delivery_plans dp
    JOIN client_warehouses cw ON cw.id = dp.client_warehouse_id
    WHERE dp.id = $1
    `,
    [planId]
  );

  if (!planResult.rows.length) {
    throw new AppError("Delivery plan not found", 404);
  }

  const ordersResult = await pool.query(
    `
    SELECT
      o.id,
      o.order_number,
      o.company_name,
      o.requested_delivery_date,
      o.delivery_time_window,
      o.urgency_level,
      o.total_pallets,
      o.planning_status,
      dpo.allocated_pallets
    FROM delivery_plan_orders dpo
    JOIN orders o ON o.id = dpo.order_id
    WHERE dpo.delivery_plan_id = $1
    ORDER BY o.requested_delivery_date ASC
    `,
    [planId]
  );

  const trucksResult = await pool.query(
    `
    SELECT
      t.id,
      t.name,
      t.license_plate,
      t.max_palettes,
      t.max_volume_m3,
      t.max_weight_kg,
      t.status,
      dpt.assigned_pallets,
      dpt.assigned_volume_m3
    FROM delivery_plan_trucks dpt
    JOIN trucks t ON t.id = dpt.truck_id
    WHERE dpt.delivery_plan_id = $1
    ORDER BY t.name ASC
    `,
    [planId]
  );

  const dockAssignmentsResult = await pool.query(
    `
    SELECT
      ld.id,
      ld.code,
      ld.side,
      ld.position_x,
      ld.position_y,
      t.id AS truck_id,
      t.name AS truck_code
    FROM delivery_plan_docks dpd
    JOIN loading_docks ld ON ld.id = dpd.loading_dock_id
    JOIN trucks t ON t.id = dpd.truck_id
    WHERE dpd.delivery_plan_id = $1
    ORDER BY ld.code ASC
    `,
    [planId]
  );

  return {
    ...planResult.rows[0],
    orders: ordersResult.rows,
    trucks: trucksResult.rows,
    dock_assignments: dockAssignmentsResult.rows
  };
}

export async function updateDeliveryPlanStatus(
  planId: string,
  status: "DRAFT" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED"
) {
  const dbClient = await pool.connect();

  try {
    await dbClient.query("BEGIN");

    const existing = await dbClient.query(
      `
      SELECT *
      FROM delivery_plans
      WHERE id = $1
      `,
      [planId]
    );

    if (!existing.rows.length) {
      throw new AppError("Delivery plan not found", 404);
    }

    const updated = await dbClient.query(
      `
      UPDATE delivery_plans
      SET status = $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [planId, status]
    );

    const truckAssignments = await dbClient.query(
      `
      SELECT truck_id
      FROM delivery_plan_trucks
      WHERE delivery_plan_id = $1
      `,
      [planId]
    );

    const dockAssignments = await dbClient.query(
      `
      SELECT loading_dock_id
      FROM delivery_plan_docks
      WHERE delivery_plan_id = $1
      `,
      [planId]
    );

    const orderAssignments = await dbClient.query(
      `
      SELECT DISTINCT order_id
      FROM delivery_plan_orders
      WHERE delivery_plan_id = $1
      `,
      [planId]
    );

    const currentOrderId =
      orderAssignments.rows.length === 1 ? orderAssignments.rows[0].order_id : null;

    if (status === "IN_PROGRESS") {
      for (const assignment of truckAssignments.rows) {
        await dbClient.query(
          `
          UPDATE trucks
          SET status = 'ON_ROUTE',
              updated_at = NOW()
          WHERE id = $1
          `,
          [assignment.truck_id]
        );
      }

      for (const assignment of dockAssignments.rows) {
        await dbClient.query(
          `
          UPDATE loading_docks
          SET status = 'OCCUPIED',
              current_order_id = $2,
              updated_at = NOW()
          WHERE id = $1
          `,
          [assignment.loading_dock_id, currentOrderId]
        );
      }
    }

    if (status === "COMPLETED" || status === "BLOCKED") {
      for (const assignment of truckAssignments.rows) {
        await dbClient.query(
          `
          UPDATE trucks
          SET status = 'AVAILABLE',
              updated_at = NOW()
          WHERE id = $1
          `,
          [assignment.truck_id]
        );
      }

      for (const assignment of dockAssignments.rows) {
        await dbClient.query(
          `
          UPDATE loading_docks
          SET status = 'FREE',
              current_order_id = NULL,
              updated_at = NOW()
          WHERE id = $1
          `,
          [assignment.loading_dock_id]
        );
      }
    }

    if (status === "COMPLETED") {
      await dbClient.query(
        `
        UPDATE orders o
        SET planning_status = 'DELIVERED',
            status = 'delivered'
        WHERE o.id IN (
          SELECT DISTINCT order_id
          FROM delivery_plan_orders
          WHERE delivery_plan_id = $1
        )
        AND NOT EXISTS (
          SELECT 1
          FROM delivery_plan_orders dpo
          JOIN delivery_plans dp ON dp.id = dpo.delivery_plan_id
          WHERE dpo.order_id = o.id
            AND dp.status <> 'COMPLETED'
        )
        `,
        [planId]
      );
    }

    await dbClient.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await dbClient.query("ROLLBACK");
    throw error;
  } finally {
    dbClient.release();
  }
}

export async function validateDeliveryPlan(planId: string) {
  return updateDeliveryPlanStatus(planId, "CONFIRMED");
}

export async function reprogramOrder(orderId: string, body: ReprogramOrderBody) {
  const dbClient = await pool.connect();

  try {
    await dbClient.query("BEGIN");

    const orderResult = await dbClient.query(
      `
      SELECT *
      FROM orders
      WHERE id = $1
      `,
      [orderId]
    );

    if (!orderResult.rows.length) {
      throw new AppError("Order not found", 404);
    }

    const currentOrder = orderResult.rows[0];

    await cleanupExistingPlansForOrder(dbClient, orderId);

    const requestedDeliveryDate =
      body.requested_delivery_date ??
      addDaysToDateString(currentOrder.requested_delivery_date, 0);

    const deliveryTimeWindow =
      body.delivery_time_window ?? currentOrder.delivery_time_window;

    const urgencyLevel = body.urgency_level ?? currentOrder.urgency_level;

    const updatedOrderResult = await dbClient.query(
      `
      UPDATE orders
      SET
        requested_delivery_date = $2,
        delivery_time_window = $3,
        urgency_level = $4,
        promised_delivery_date = $2,
        promised_time_window = $3,
        service_level = $5,
        planning_status = 'UNPLANNED',
        blocked_reason = NULL,
        planned_delivery_date = NULL
      WHERE id = $1
      RETURNING *
      `,
      [
        orderId,
        requestedDeliveryDate,
        deliveryTimeWindow,
        urgencyLevel,
        getServiceLevel(urgencyLevel as Priority)
      ]
    );

    await dbClient.query("COMMIT");

    const updatedOrder = updatedOrderResult.rows[0];
    const autoReplan = body.auto_replan ?? true;

    if (!autoReplan) {
      return {
        message: "Order updated and marked as UNPLANNED",
        order: updatedOrder
      };
    }

    const replanningResult = await generateDeliveryPlansInternal([orderId]);

    return {
      message: "Order updated and replanning attempted",
      order: updatedOrder,
      replanning: replanningResult
    };
  } catch (error) {
    await dbClient.query("ROLLBACK");
    throw error;
  } finally {
    dbClient.release();
  }
}
