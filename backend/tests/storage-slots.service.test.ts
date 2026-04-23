/// <reference types="jest" />

import pool from "../src/infrastructure/database/db";
import { AppError } from "../src/common/errors/app-error";
import {
  createStorageSlot,
  patchStorageSlot
} from "../src/modules/storage-slots/storage-slots.service";

jest.mock("../src/infrastructure/database/db", () => ({
  __esModule: true,
  default: {
    query: jest.fn()
  }
}));

const mockQuery = pool.query as jest.Mock;

describe("storage slots service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a storage slot", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "aisle-1" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "slot-1",
            aisle_id: "aisle-1",
            rank: "35",
            status: "PARTIAL"
          }
        ]
      });

    const result = await createStorageSlot(
      {
        aisle_id: "aisle-1",
        rank: "35",
        side: "LEFT",
        total_volume: 12,
        used_volume: 6,
        total_pallets: 8,
        used_pallets: 4,
        status: "PARTIAL"
      },
      {
        id: "client-1",
        role: "client"
      }
    );

    expect(result.id).toBe("slot-1");
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("rejects when used volume exceeds total volume", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "aisle-1" }] });

    await expect(
      createStorageSlot(
        {
          aisle_id: "aisle-1",
          rank: "35",
          side: "LEFT",
          total_volume: 10,
          used_volume: 12
        },
        {
          id: "client-1",
          role: "client"
        }
      )
    ).rejects.toBeInstanceOf(AppError);
  });

  it("updates a storage slot", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "slot-1" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "slot-1",
            total_volume: 12,
            used_volume: 4,
            total_pallets: 8,
            used_pallets: 2,
            status: "PARTIAL"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "slot-1",
            total_volume: 12,
            used_volume: 8,
            total_pallets: 8,
            used_pallets: 5,
            status: "PARTIAL"
          }
        ]
      });

    const result = await patchStorageSlot(
      "slot-1",
      {
        used_volume: 8,
        used_pallets: 5,
        status: "PARTIAL"
      },
      {
        id: "client-1",
        role: "client"
      }
    );

    expect(result.used_volume).toBe(8);
  });
});
