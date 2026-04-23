import type { PoolClient } from "pg";
import pool from "../../infrastructure/database/db";
import { AppError } from "../../common/errors/app-error";

type Priority = "urgent" | "standard" | "flexible";
type PlanningBlockReason =
  | "INSUFFICIENT_CLIENT_STORAGE"
  | "INSUFFICIENT_DOCK_CAPACITY"
  | "NO_AVAILABLE_TRUCK"
  | "TRUCK_CAPACITY_TOO_LOW";

type PlanningIssue = PlanningBlockReason | "REMAINING_PALLETS_NOT_SCHEDULED";

type TruckRow = {
  id: string;
  code: string;
  max_pallets: number;
  max_volume_m3: number;
  max_weight_kg: number;
  status: "AVAILABLE" | "IN_DELIVERY" | "MAINTENANCE";
};

function getPriorityScore(priority: Priority) {
  if (priority === "urgent") return 100;
  if (priority === "standard") return 60;
  return 20;
}

function addDaysToDateString(dateString: string, days: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
}

function getMaxTruckCapacityForDate(availableTrucks: TruckRow[], usableDocks: number) {
  return [...availableTrucks]
    .sort((a, b) => Number(b.max_pallets) - Number(a.max_pallets))
    .slice(0, usableDocks)
    .reduce((sum, truck) => sum + Number(truck.max_pallets), 0);
}

function selectTrucks(
  availableTrucks: TruckRow[],
  totalPallets: number,
  usableDocks: number
) {
  if (usableDocks <= 0) {
    return {
      selected: [] as Array<{ truck: TruckRow; assignedPallets: number }>,
      reason: "INSUFFICIENT_DOCK_CAPACITY" as PlanningBlockReason
    };
  }

  const sorted = [...availableTrucks].sort(
    (a, b) => Number(b.max_pallets) - Number(a.max_pallets)
  );
  const byDockCapacity = sorted.slice(0, usableDocks);

  const totalAllTruckCapacity = sorted.reduce(
    (sum, truck) => sum + Number(truck.max_pallets),
    0
  );
  const totalDockLimitedCapacity = byDockCapacity.reduce(
    (sum, truck) => sum + Number(truck.max_pallets),
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

  for (const truck of byDockCapacity) {
    if (remaining <= 0) break;

    const assignedPallets = Math.min(Number(truck.max_pallets), remaining);
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
      COALESCE(SUM(ss.total_pallets), 0) AS max_capacity_pallets,
      COALESCE(SUM(ss.used_pallets), 0) AS used_pallets,
      COUNT(DISTINCT ld.id) FILTER (WHERE ld.status <> 'MAINTENANCE') AS usable_docks
    FROM client_warehouses cw
    LEFT JOIN warehouse_floors wf ON wf.client_warehouse_id = cw.id
    LEFT JOIN warehouse_aisles wa ON wa.floor_id = wf.id
    LEFT JOIN storage_slots ss ON ss.aisle_id = wa.id
    LEFT JOIN loading_docks ld ON ld.client_warehouse_id = cw.id
    WHERE cw.id = $1
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
  const usableDocks = Number(capacity.usable_docks ?? 0);

  return {
    maxCapacityPallets,
    usedPallets,
    reservedPallets,
    usableDocks,
    remainingStoragePallets: maxCapacityPallets - usedPallets - reservedPallets
  };
}

async function getAvailableTrucksForDate(dbClient: PoolClient, plannedDate: string) {
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
      )
    ORDER BY max_pallets DESC, code ASC
    `,
    [plannedDate]
  );

  return result.rows as TruckRow[];
}

export async function generateDeliveryPlans() {
  const dbClient = await pool.connect();

  try {
    await dbClient.query("BEGIN");

    const ordersResult = await dbClient.query(
      `
      SELECT
        o.*,
        cw.name AS client_warehouse_name
      FROM orders o
      JOIN client_warehouses cw ON cw.id = o.client_warehouse_id
      WHERE o.planning_status = 'UNPLANNED'
      ORDER BY
        CASE o.urgency_level
          WHEN 'urgent' THEN 0
          WHEN 'standard' THEN 1
          ELSE 2
        END,
        o.requested_delivery_date ASC,
        o.created_at ASC
      `
    );

    const generatedPlans: Array<{
      delivery_plan_id: string;
      order_id: string;
      order_number: string;
      allocated_pallets: number;
      trucks: string[];
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

        const constraints = await getWarehousePlanningConstraints(
          dbClient,
          order.client_warehouse_id,
          plannedDate
        );

        if (constraints.remainingStoragePallets <= 0) {
          lastIssue = "INSUFFICIENT_CLIENT_STORAGE";
          continue;
        }

        if (constraints.usableDocks <= 0) {
          lastIssue = "INSUFFICIENT_DOCK_CAPACITY";
          continue;
        }

        const availableTrucks = await getAvailableTrucksForDate(dbClient, plannedDate);

        if (!availableTrucks.length) {
          lastIssue = "NO_AVAILABLE_TRUCK";
          continue;
        }

        const maxTruckCapacityForDate = getMaxTruckCapacityForDate(
          availableTrucks,
          constraints.usableDocks
        );

        if (maxTruckCapacityForDate <= 0) {
          lastIssue = "INSUFFICIENT_DOCK_CAPACITY";
          continue;
        }

        const palletsToAllocate = splitAllowed
          ? Math.min(
              remainingPallets,
              constraints.remainingStoragePallets,
              maxTruckCapacityForDate
            )
          : remainingPallets;

        if (palletsToAllocate <= 0) {
          lastIssue = "INSUFFICIENT_CLIENT_STORAGE";
          continue;
        }

        const selection = selectTrucks(
          availableTrucks,
          palletsToAllocate,
          constraints.usableDocks
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
            order.delivery_time_window,
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

        for (const { truck, assignedPallets } of selection.selected) {
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
        }

        generatedPlans.push({
          delivery_plan_id: deliveryPlan.id,
          order_id: order.id,
          order_number: order.order_number,
          allocated_pallets: palletsToAllocate,
          trucks: selection.selected.map((item) => item.truck.code),
          planned_delivery_date: plannedDate,
          planned_time_window: order.delivery_time_window
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

export async function listDeliveryPlans() {
  const result = await pool.query(
    `
    SELECT
      dp.*,
      cw.name AS client_warehouse_name,
      COUNT(DISTINCT dpo.order_id) AS orders_count,
      COUNT(DISTINCT dpt.truck_id) AS trucks_count
    FROM delivery_plans dp
    JOIN client_warehouses cw ON cw.id = dp.client_warehouse_id
    LEFT JOIN delivery_plan_orders dpo ON dpo.delivery_plan_id = dp.id
    LEFT JOIN delivery_plan_trucks dpt ON dpt.delivery_plan_id = dp.id
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
      t.code,
      t.max_pallets,
      t.max_volume_m3,
      t.max_weight_kg,
      t.status,
      dpt.assigned_pallets,
      dpt.assigned_volume_m3
    FROM delivery_plan_trucks dpt
    JOIN trucks t ON t.id = dpt.truck_id
    WHERE dpt.delivery_plan_id = $1
    ORDER BY t.code ASC
    `,
    [planId]
  );

  return {
    ...planResult.rows[0],
    orders: ordersResult.rows,
    trucks: trucksResult.rows
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

    if (status === "IN_PROGRESS") {
      for (const assignment of truckAssignments.rows) {
        await dbClient.query(
          `
          UPDATE trucks
          SET status = 'IN_DELIVERY',
              updated_at = NOW()
          WHERE id = $1
          `,
          [assignment.truck_id]
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
