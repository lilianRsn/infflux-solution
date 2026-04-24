/// <reference types="jest" />

import pool from "../src/infrastructure/database/db";
import { getOccupancyMetrics } from "../src/modules/client-warehouses/client-warehouses.service";

jest.mock("../src/infrastructure/database/db", () => ({
  __esModule: true,
  default: {
    query: jest.fn()
  }
}));

const mockQuery = pool.query as jest.Mock;

describe("client warehouses occupancy metrics service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns occupancy metrics for a warehouse", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "warehouse-1", name: "Entrepot Lyon" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            free_slots: "3",
            partial_slots: "2",
            full_slots: "1",
            total_slots: "6",
            max_capacity_volume: "120",
            used_volume: "60",
            available_volume: "60",
            max_capacity_pallets: "48",
            used_pallets: "24",
            available_pallets: "24"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            reserved_pallets: "6"
          }
        ]
      });

    const result = await getOccupancyMetrics("warehouse-1", {
      id: "admin-1",
      role: "admin",
      email: "admin@example.com"
    });

    expect(result.occupancy_rate).toBe(50);
    expect(result.free_slots).toBe(3);
    expect(result.available_volume).toBe(60);
    expect(result.max_capacity_pallets).toBe(48);
    expect(result.reserved_pallets).toBe(6);
  });
});
