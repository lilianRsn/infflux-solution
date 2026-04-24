/// <reference types="jest" />

import pool from "../src/infrastructure/database/db";
import { AppError } from "../src/common/errors/app-error";
import {
  generateDeliveryPlans,
  getDeliveryPlanById,
  listDeliveryPlans,
  reprogramOrder,
  updateDeliveryPlanStatus,
  validateDeliveryPlan
} from "../src/modules/delivery-plans/delivery-plans.service";

jest.mock("../src/infrastructure/database/db", () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

const mockPoolQuery = pool.query as jest.Mock;
const mockConnect = pool.connect as jest.Mock;

describe("delivery plans service", () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue(mockClient);
  });

  it("generates a delivery plan with assigned truck and dock", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({
        rows: [
          {
            id: "order-1",
            order_number: "ORD-1",
            client_warehouse_id: "warehouse-1",
            requested_delivery_date: new Date("2026-04-24T00:00:00.000Z"),
            delivery_time_window: "morning",
            urgency_level: "urgent",
            total_pallets: 6,
            split_delivery_allowed: false,
            created_at: "2026-04-23T10:00:00.000Z"
          }
        ]
      }) // load orders
      .mockResolvedValueOnce({
        rows: [
          {
            max_capacity_pallets: "20",
            used_pallets: "5"
          }
        ]
      }) // capacity
      .mockResolvedValueOnce({
        rows: [
          {
            reserved_pallets: "0"
          }
        ]
      }) // reserved
      .mockResolvedValueOnce({
        rows: [
          {
            id: "dock-1",
            code: "D1",
            side: "N",
            position_x: 5,
            position_y: 10,
            status: "FREE"
          }
        ]
      }) // available docks
      .mockResolvedValueOnce({
        rows: [
          {
            id: "truck-1",
            name: "Truck Alpha",
            license_plate: "AA-123-AA",
            max_palettes: 12,
            max_volume_m3: 45,
            max_weight_kg: 18000,
            status: "AVAILABLE"
          }
        ]
      }) // available trucks
      .mockResolvedValueOnce({
        rows: [{ id: "plan-1" }]
      }) // insert delivery plan
      .mockResolvedValueOnce({ rows: [] }) // insert delivery_plan_orders
      .mockResolvedValueOnce({ rows: [] }) // insert delivery_plan_trucks
      .mockResolvedValueOnce({ rows: [] }) // insert delivery_plan_docks
      .mockResolvedValueOnce({ rows: [] }) // update order
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const result = await generateDeliveryPlans();

    expect(result.generated_count).toBe(1);
    expect(result.blocked_count).toBe(0);
    expect(result.partially_planned_count).toBe(0);
    expect(result.generated_plans[0]).toMatchObject({
      delivery_plan_id: "plan-1",
      order_id: "order-1",
      order_number: "ORD-1",
      allocated_pallets: 6,
      trucks: ["Truck Alpha"],
      assigned_docks: ["D1"],
      planned_delivery_date: "2026-04-24",
      planned_time_window: "morning"
    });

    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("blocks an order when no dock is available", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({
        rows: [
          {
            id: "order-1",
            order_number: "ORD-1",
            client_warehouse_id: "warehouse-1",
            requested_delivery_date: "2026-04-24",
            delivery_time_window: "morning",
            urgency_level: "standard",
            total_pallets: 8,
            split_delivery_allowed: false,
            created_at: "2026-04-23T10:00:00.000Z"
          }
        ]
      }) // load orders
      .mockResolvedValueOnce({
        rows: [
          {
            max_capacity_pallets: "30",
            used_pallets: "4"
          }
        ]
      }) // capacity
      .mockResolvedValueOnce({
        rows: [{ reserved_pallets: "0" }]
      }) // reserved
      .mockResolvedValueOnce({
        rows: []
      }) // no docks
      .mockResolvedValueOnce({ rows: [] }) // update blocked order
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const result = await generateDeliveryPlans();

    expect(result.generated_count).toBe(0);
    expect(result.blocked_count).toBe(1);
    expect(result.blocked_orders[0]).toMatchObject({
      order_id: "order-1",
      order_number: "ORD-1",
      blocked_reason: "INSUFFICIENT_DOCK_CAPACITY"
    });
  });

  it("returns delivery plans list", async () => {
    mockPoolQuery.mockResolvedValueOnce({
      rows: [
        {
          id: "plan-1",
          client_warehouse_name: "Warehouse A",
          planned_time_window: "morning",
          orders_count: "1",
          trucks_count: "1",
          docks_count: "1"
        }
      ]
    });

    const result = await listDeliveryPlans();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("plan-1");
    expect(result[0].client_warehouse_name).toBe("Warehouse A");
    expect(result[0].docks_count).toBe("1");
  });

  it("returns a delivery plan with orders, trucks and dock assignments", async () => {
    mockPoolQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: "plan-1",
            client_warehouse_name: "Warehouse A",
            client_warehouse_address: "25 avenue Livraison, Lyon"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "order-1",
            order_number: "ORD-1",
            allocated_pallets: 6
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "truck-1",
            name: "Truck Alpha",
            assigned_pallets: 6
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "dock-1",
            code: "D1",
            truck_id: "truck-1",
            truck_code: "Truck Alpha"
          }
        ]
      });

    const result = await getDeliveryPlanById("plan-1");

    expect(result.id).toBe("plan-1");
    expect(result.orders).toHaveLength(1);
    expect(result.trucks).toHaveLength(1);
    expect(result.dock_assignments).toHaveLength(1);
    expect(result.dock_assignments[0].code).toBe("D1");
  });

  it("throws when delivery plan is not found", async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] });

    await expect(getDeliveryPlanById("missing-plan")).rejects.toBeInstanceOf(AppError);
  });

  it("validates a delivery plan by setting it to CONFIRMED", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: "plan-1", status: "DRAFT" }]
      }) // existing
      .mockResolvedValueOnce({
        rows: [{ id: "plan-1", status: "CONFIRMED" }]
      }) // update
      .mockResolvedValueOnce({
        rows: [{ truck_id: "truck-1" }]
      }) // truck assignments
      .mockResolvedValueOnce({
        rows: [{ loading_dock_id: "dock-1" }]
      }) // dock assignments
      .mockResolvedValueOnce({
        rows: [{ order_id: "order-1" }]
      }) // order assignments
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const result = await validateDeliveryPlan("plan-1");

    expect(result.status).toBe("CONFIRMED");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
  });

  it("moves a delivery plan to IN_PROGRESS and updates trucks, docks and order status", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: "plan-1", status: "CONFIRMED" }]
      }) // existing
      .mockResolvedValueOnce({
        rows: [{ id: "plan-1", status: "IN_PROGRESS" }]
      }) // update
      .mockResolvedValueOnce({
        rows: [{ truck_id: "truck-1" }]
      }) // truck assignments
      .mockResolvedValueOnce({
        rows: [{ loading_dock_id: "dock-1" }]
      }) // dock assignments
      .mockResolvedValueOnce({
        rows: [{ order_id: "order-1" }]
      }) // order assignments
      .mockResolvedValueOnce({ rows: [] }) // update truck
      .mockResolvedValueOnce({ rows: [] }) // update dock
      .mockResolvedValueOnce({ rows: [] }) // update order status in_progress
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const result = await updateDeliveryPlanStatus("plan-1", "IN_PROGRESS");

    expect(result.status).toBe("IN_PROGRESS");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
  });

  it("reprograms an order without auto replanning", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({
        rows: [
          {
            id: "order-1",
            requested_delivery_date: new Date("2026-04-24T00:00:00.000Z"),
            delivery_time_window: "morning",
            urgency_level: "standard"
          }
        ]
      }) // select order
      .mockResolvedValueOnce({ rows: [] }) // cleanup select linked plans
      .mockResolvedValueOnce({
        rows: [
          {
            id: "order-1",
            requested_delivery_date: "2026-04-28",
            delivery_time_window: "afternoon",
            urgency_level: "urgent",
            planning_status: "UNPLANNED"
          }
        ]
      }) // update order
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const result = await reprogramOrder("order-1", {
      requested_delivery_date: "2026-04-28",
      delivery_time_window: "afternoon",
      urgency_level: "urgent",
      auto_replan: false
    });

    expect(result).toMatchObject({
      message: "Order updated and marked as UNPLANNED",
      order: {
        id: "order-1",
        requested_delivery_date: "2026-04-28",
        delivery_time_window: "afternoon",
        urgency_level: "urgent",
        planning_status: "UNPLANNED"
      }
    });

    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
  });

  it("rejects reprogramming when the order is linked to a grouped delivery plan", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({
        rows: [
          {
            id: "order-1",
            requested_delivery_date: "2026-04-24",
            delivery_time_window: "morning",
            urgency_level: "standard"
          }
        ]
      }) // select order
      .mockResolvedValueOnce({
        rows: [
          {
            id: "plan-1",
            status: "DRAFT",
            orders_count: "2"
          }
        ]
      }) // cleanup linked plans -> grouped
      .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

    await expect(
      reprogramOrder("order-1", {
        requested_delivery_date: "2026-04-28",
        auto_replan: false
      })
    ).rejects.toBeInstanceOf(AppError);

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
  });
});
