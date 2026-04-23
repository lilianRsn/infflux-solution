/// <reference types="jest" />

import pool from "../src/infrastructure/database/db";
import { AppError } from "../src/common/errors/app-error";
import {
  generateDeliveryPlans,
  getDeliveryPlanById,
  listDeliveryPlans,
  updateDeliveryPlanStatus
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

  it("generates a delivery plan for a plannable order", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "order-1",
            order_number: "ORD-1",
            client_warehouse_id: "warehouse-1",
            requested_delivery_date: "2026-04-24",
            urgency_level: "urgent",
            total_pallets: 6,
            created_at: "2026-04-23T10:00:00.000Z"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "truck-1",
            code: "TRUCK-1",
            max_pallets: 10,
            max_volume_m3: 0,
            max_weight_kg: 0,
            status: "AVAILABLE"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            max_capacity_pallets: "20",
            used_pallets: "5",
            usable_docks: "2"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            reserved_pallets: "0"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "plan-1"
          }
        ]
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await generateDeliveryPlans();

    expect(result.generated_count).toBe(1);
    expect(result.blocked_count).toBe(0);
    expect(result.generated_plans[0]).toMatchObject({
      delivery_plan_id: "plan-1",
      order_id: "order-1",
      order_number: "ORD-1",
      planned_delivery_date: "2026-04-24",
      trucks: ["TRUCK-1"]
    });

    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("blocks an order when client storage is insufficient", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "order-1",
            order_number: "ORD-1",
            client_warehouse_id: "warehouse-1",
            requested_delivery_date: "2026-04-24",
            urgency_level: "standard",
            total_pallets: 12,
            created_at: "2026-04-23T10:00:00.000Z"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "truck-1",
            code: "TRUCK-1",
            max_pallets: 20,
            max_volume_m3: 0,
            max_weight_kg: 0,
            status: "AVAILABLE"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            max_capacity_pallets: "10",
            used_pallets: "4",
            usable_docks: "2"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            reserved_pallets: "0"
          }
        ]
      })
      .mockResolvedValueOnce({ rows: [] });

    const result = await generateDeliveryPlans();

    expect(result.generated_count).toBe(0);
    expect(result.blocked_count).toBe(1);
    expect(result.blocked_orders[0]).toMatchObject({
      order_id: "order-1",
      order_number: "ORD-1",
      blocked_reason: "INSUFFICIENT_CLIENT_STORAGE"
    });

    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
  });

  it("blocks an order when dock capacity is insufficient for the needed trucks", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "order-1",
            order_number: "ORD-1",
            client_warehouse_id: "warehouse-1",
            requested_delivery_date: "2026-04-24",
            urgency_level: "standard",
            total_pallets: 12,
            created_at: "2026-04-23T10:00:00.000Z"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "truck-1",
            code: "TRUCK-1",
            max_pallets: 7,
            max_volume_m3: 0,
            max_weight_kg: 0,
            status: "AVAILABLE"
          },
          {
            id: "truck-2",
            code: "TRUCK-2",
            max_pallets: 7,
            max_volume_m3: 0,
            max_weight_kg: 0,
            status: "AVAILABLE"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            max_capacity_pallets: "40",
            used_pallets: "5",
            usable_docks: "1"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            reserved_pallets: "0"
          }
        ]
      })
      .mockResolvedValueOnce({ rows: [] });

    const result = await generateDeliveryPlans();

    expect(result.generated_count).toBe(0);
    expect(result.blocked_count).toBe(1);
    expect(result.blocked_orders[0].blocked_reason).toBe("INSUFFICIENT_DOCK_CAPACITY");
  });

  it("returns delivery plans list", async () => {
    mockPoolQuery.mockResolvedValueOnce({
      rows: [
        {
          id: "plan-1",
          client_warehouse_name: "Warehouse A",
          orders_count: "1",
          trucks_count: "1"
        }
      ]
    });

    const result = await listDeliveryPlans();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("plan-1");
    expect(result[0].client_warehouse_name).toBe("Warehouse A");
  });

  it("returns a delivery plan with its orders and trucks", async () => {
    mockPoolQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: "plan-1",
            client_warehouse_name: 'Warehouse A',
            client_warehouse_address: "25 avenue Livraison, Lyon"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "order-1",
            order_number: "ORD-1"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "truck-1",
            code: "TRUCK-1",
            assigned_pallets: 6
          }
        ]
      });

    const result = await getDeliveryPlanById("plan-1");

    expect(result.id).toBe("plan-1");
    expect(result.orders).toHaveLength(1);
    expect(result.trucks).toHaveLength(1);
    expect(result.trucks[0].code).toBe("TRUCK-1");
  });

  it("throws when delivery plan is not found", async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] });

    await expect(getDeliveryPlanById("missing-plan")).rejects.toBeInstanceOf(AppError);
  });

  it("marks a delivery plan as completed and releases trucks", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "plan-1",
            status: "DRAFT"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "plan-1",
            status: "COMPLETED"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          { truck_id: "truck-1" },
          { truck_id: "truck-2" }
        ]
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await updateDeliveryPlanStatus("plan-1", "COMPLETED");

    expect(result.status).toBe("COMPLETED");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("throws when updating a missing delivery plan", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(
      updateDeliveryPlanStatus("missing-plan", "CONFIRMED")
    ).rejects.toBeInstanceOf(AppError);

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
  });
});
