/// <reference types="jest" />

import pool from "../src/infrastructure/database/db";
import { AppError } from "../src/common/errors/app-error";
import {
  updateAisle,
  updateExterior,
  updateFloor,
  updateParkingZone,
  updateWarehouse
} from "../src/modules/client-warehouses/client-warehouses.service";

jest.mock("../src/infrastructure/database/db", () => ({
  __esModule: true,
  default: {
    query: jest.fn()
  }
}));

const mockQuery = pool.query as jest.Mock;

describe("client warehouses patch service", () => {
  const clientUser = {
    id: "client-1",
    role: "client" as const,
    email: "client@example.com"
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates a warehouse owned by the client", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "warehouse-1" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "warehouse-1",
            name: "Old Warehouse",
            address: "Old Address",
            floors_count: 1
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "warehouse-1",
            name: "New Warehouse",
            address: "New Address",
            floors_count: 2
          }
        ]
      });

    const result = await updateWarehouse(
      "warehouse-1",
      {
        name: "New Warehouse",
        address: "New Address",
        floors_count: 2
      },
      clientUser
    );

    expect(result.name).toBe("New Warehouse");
    expect(result.address).toBe("New Address");
    expect(result.floors_count).toBe(2);
  });

  it("throws forbidden when client tries to update another warehouse", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(
      updateWarehouse(
        "warehouse-1",
        { name: "Blocked Update" },
        clientUser
      )
    ).rejects.toMatchObject({
      message: "Forbidden",
      statusCode: 403
    });
  });

  it("updates a floor", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "floor-1" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "floor-1",
            level: 1,
            label: "RDC"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "floor-1",
            level: 2,
            label: "Etage 1"
          }
        ]
      });

    const result = await updateFloor(
      "floor-1",
      {
        level: 2,
        label: "Etage 1"
      },
      clientUser
    );

    expect(result.level).toBe(2);
    expect(result.label).toBe("Etage 1");
  });

  it("updates an aisle", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "aisle-1" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "aisle-1",
            code: "A",
            position_x: 10,
            position_y: 20
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "aisle-1",
            code: "B",
            position_x: 30,
            position_y: 40
          }
        ]
      });

    const result = await updateAisle(
      "aisle-1",
      {
        code: "B",
        position_x: 30,
        position_y: 40
      },
      clientUser
    );

    expect(result.code).toBe("B");
    expect(result.position_x).toBe(30);
    expect(result.position_y).toBe(40);
  });

  it("updates an exterior layout", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "warehouse-1" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            client_warehouse_id: "warehouse-1",
            site_width: 100,
            site_height: 60,
            building_x: 20,
            building_y: 10,
            building_width: 50,
            building_height: 30,
            access_direction: "N"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            client_warehouse_id: "warehouse-1",
            site_width: 120,
            site_height: 70,
            building_x: 25,
            building_y: 15,
            building_width: 55,
            building_height: 35,
            access_direction: "E"
          }
        ]
      });

    const result = await updateExterior(
      "warehouse-1",
      {
        site_width: 120,
        site_height: 70,
        building_x: 25,
        building_y: 15,
        building_width: 55,
        building_height: 35,
        access_direction: "E"
      },
      clientUser
    );

    expect(result.site_width).toBe(120);
    expect(result.access_direction).toBe("E");
  });

  it("updates a parking zone", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "parking-1" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "parking-1",
            position_x: 70,
            position_y: 20,
            width: 20,
            height: 10,
            capacity: 4
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "parking-1",
            position_x: 80,
            position_y: 25,
            width: 25,
            height: 12,
            capacity: 6
          }
        ]
      });

    const result = await updateParkingZone(
      "parking-1",
      {
        position_x: 80,
        position_y: 25,
        width: 25,
        height: 12,
        capacity: 6
      },
      clientUser
    );

    expect(result.position_x).toBe(80);
    expect(result.capacity).toBe(6);
  });
});
