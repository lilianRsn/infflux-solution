/// <reference types="jest" />

import pool from "../src/infrastructure/database/db";
import { AppError } from "../src/common/errors/app-error";
import {
  createWarehouse,
  getAvailability,
  getWarehouseLayout
} from "../src/modules/client-warehouses/client-warehouses.service";

jest.mock("../src/infrastructure/database/db", () => ({
  __esModule: true,
  default: {
    query: jest.fn()
  }
}));

const mockQuery = pool.query as jest.Mock;

describe("client warehouses service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a warehouse for the authenticated client", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: "warehouse-1",
          client_id: "client-1",
          name: "Entrepot Lyon",
          address: "25 avenue Livraison, Lyon",
          floors_count: 2
        }
      ]
    });

    const result = await createWarehouse(
      {
        name: "Entrepot Lyon",
        address: "25 avenue Livraison, Lyon",
        floors_count: 2
      },
      {
        id: "client-1",
        role: "client",
        email: "client@example.com"
      }
    );

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO client_warehouses"),
      ["client-1", "Entrepot Lyon", "25 avenue Livraison, Lyon", 2]
    );
    expect(result.name).toBe("Entrepot Lyon");
  });

  it("throws when admin creates a warehouse without client_id", async () => {
    await expect(
      createWarehouse(
        {
          name: "Entrepot Lyon",
          address: "25 avenue Livraison, Lyon"
        },
        {
          id: "admin-1",
          role: "admin",
          email: "admin@example.com"
        }
      )
    ).rejects.toBeInstanceOf(AppError);
  });

  it("builds a nested layout response", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: "warehouse-1",
            name: "Entrepot Lyon",
            address: "25 avenue Livraison, Lyon"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            floor_id: "floor-1",
            level: 1,
            label: "RDC",
            aisle_id: "aisle-1",
            code: "A",
            position_x: 10,
            position_y: 20,
            slot_id: "slot-1",
            rank: "35",
            side: "LEFT",
            total_volume: 12,
            used_volume: 7,
            total_pallets: 8,
            used_pallets: 5,
            status: "PARTIAL",
            updated_at: "2026-04-23T10:00:00.000Z"
          }
        ]
      });

    const result = await getWarehouseLayout("warehouse-1", {
      id: "admin-1",
      role: "admin",
      email: "admin@example.com"
    });

    expect(result.floors).toHaveLength(1);
    expect(result.floors[0].aisles).toHaveLength(1);
    expect(result.floors[0].aisles[0].slots[0].rank).toBe("35");
  });

  it("returns aggregated availability rows", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          warehouse_id: "warehouse-1",
          warehouse_name: "Entrepot Lyon",
          available_volume: 180,
          available_pallets: 60,
          free_docks: 2
        }
      ]
    });

    const result = await getAvailability();

    expect(result).toHaveLength(1);
    expect(result[0].free_docks).toBe(2);
  });
});