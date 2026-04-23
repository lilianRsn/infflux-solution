import type { PoolClient } from "pg";
import pool from "../../infrastructure/database/db";
import { AppError } from "../../common/errors/app-error";

type Priority = "urgent" | "standard" | "flexible";
type PlanningBlockReason =
  | "INSUFFICIENT_CLIENT_STORAGE"
  | "INSUFFICIENT_DOCK_CAPACITY"
  | "NO_AVAILABLE_TRUCK"
  | "TRUCK_CAPACITY_TOO_LOW";

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

function getUrgencySortValue(priority: Priority) {
  if (priority === "urgent") return 0;
  if (priority === "standard") return 1;
  return 2;
}

function selectTrucks(
  availableTrucks: TruckRow[],
  totalPallets: number,
  usableDocks: number
) {
  if (usableDocks <= 0) {
    return { selected: [] as Array<{ truck: TruckRow; assignedPallets: number }>, reason: "INSUFFICIENT_DOCK_CAPACITY" as PlanningBlockReason };
  }

  const sorted = [...availableTrucks].sort((a, b) => b.max_pallets - a.max_pallets);
  const byDockCapacity = sorted.slice(0, usableDocks);

  const totalAllTruckCapacity = sorted.reduce((sum, truck) => sum + Number(truck.max_pallets), 0);
  const totalDockLimitedCapacity = byDockCapacity.reduce(
    (sum, truck) => sum + Number(truck.max_pallets),
    0
  );

  if (totalAllTruckCapacity < totalPallets) {
    return { selected: [] as Array<{ truck: TruckRow; assignedPallets: number }>, reason: "NO_AVAILABLE_TRUCK" as PlanningBlockReason };
  }

  if (totalDockLimitedCapacity < totalPallets) {
    return { selected: [] as Array<{ truck: TruckRow; assignedPallets: number }>, reason: "INSUFFICIENT_DOCK_CAPACITY" as PlanningBlockReason };
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
    return { selected: [] as Array<{ truck: TruckRow; assignedPallets: number }>, reason: "TRUCK_CAPACITY_TOO_LOW" as PlanningBlockReason };
  }

  return { selected, reason: null as PlanningBlockReason | null };
}

async function getWarehousePlanningConstraints(
  dbClient: PoolClient,
  clientWarehouseId: string,
  requestedDate: string
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
    [clientWarehouseId, requestedDate]
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

    const availableTrucksResult = await dbClient.query(
      `
      SELECT *
      FROM trucks
      WHERE status = 'AVAILABLE'
      ORDER BY max_pallets DESC, code ASC
      `
    );

    const availableTrucks: TruckRow[] = availableTrucksResult.rows;
    const generatedPlans: Array<{
      delivery_plan_id: string;
      order_id: string;
      order_number: string;
      trucks: string[];
      planned_delivery_date: string;
    }> = [];
    const blockedOrders: Array<{
      order_id: string;
      order_number: string;
      blocked_reason: PlanningBlockReason;
    }> = [];

    for (const order of ordersResult.rows) {
      const constraints = await getWarehousePlanningConstraints(
        dbClient,
        order.client_warehouse_id,
        order.requested_delivery_date
      );

      if (constraints.remainingStoragePallets < Number(order.total_pallets)) {
        await dbClient.query(
          `
          UPDATE orders
          SET planning_status = 'BLOCKED',
              blocked_reason = 'INSUFFICIENT_CLIENT_STORAGE'
          WHERE id = $1
          `,
          [order.id]
        );

        blockedOrders.push({
          order_id: order.id,
          order_number: order.order_number,
          blocked_reason: "INSUFFICIENT_CLIENT_STORAGE"
        });

        continue;
      }

      const selection = selectTrucks(
        availableTrucks,
        Number(order.total_pallets),
        constraints.usableDocks
      );

      if (selection.reason) {
        await dbClient.query(
          `
          UPDATE orders
          SET planning_status = 'BLOCKED',
              blocked_reason = $2
          WHERE id = $1
          `,
          [order.id, selection.reason]
        );

        blockedOrders.push({
          order_id: order.id,
          order_number: order.order_number,
          blocked_reason: selection.reason
        });

        continue;
      }

      const deliveryPlanResult = await dbClient.query(
        `
        INSERT INTO delivery_plans (
          planned_delivery_date,
          client_warehouse_id,
          status,
          total_pallets,
          total_volume_m3,
          priority_score
        )
        VALUES ($1, $2, 'DRAFT', $3, 0, $4)
        RETURNING *
        `,
        [
          order.requested_delivery_date,
          order.client_warehouse_id,
          Number(order.total_pallets),
          getPriorityScore(order.urgency_level as Priority)
        ]
      );

      const deliveryPlan = deliveryPlanResult.rows[0];

      await dbClient.query(
        `
        INSERT INTO delivery_plan_orders (delivery_plan_id, order_id)
        VALUES ($1, $2)
        `,
        [deliveryPlan.id, order.id]
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

        await dbClient.query(
          `
          UPDATE trucks
          SET status = 'IN_DELIVERY',
              updated_at = NOW()
          WHERE id = $1
          `,
          [truck.id]
        );

        const truckIndex = availableTrucks.findIndex((item) => item.id === truck.id);
        if (truckIndex >= 0) {
          availableTrucks.splice(truckIndex, 1);
        }
      }

      await dbClient.query(
        `
        UPDATE orders
        SET planning_status = 'PLANNED',
            blocked_reason = NULL,
            planned_delivery_date = $2
        WHERE id = $1
        `,
        [order.id, order.requested_delivery_date]
      );

      generatedPlans.push({
        delivery_plan_id: deliveryPlan.id,
        order_id: order.id,
        order_number: order.order_number,
        trucks: selection.selected.map((item) => item.truck.code),
        planned_delivery_date: order.requested_delivery_date
      });
    }

    await dbClient.query("COMMIT");

    return {
      generated_count: generatedPlans.length,
      blocked_count: blockedOrders.length,
      generated_plans: generatedPlans,
      blocked_orders: blockedOrders
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
      o.urgency_level,
      o.total_pallets,
      o.planning_status
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
        UPDATE orders
        SET planning_status = 'DELIVERED',
            status = 'delivered'
        WHERE id IN (
          SELECT order_id
          FROM delivery_plan_orders
          WHERE delivery_plan_id = $1
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
