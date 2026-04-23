/// <reference types="jest" />

import pool from "../src/infrastructure/database/db";
import { patchLoadingDock } from "../src/modules/loading-docks/loading-docks.service";

jest.mock("../src/infrastructure/database/db", () => ({
  __esModule: true,
  default: {
    query: jest.fn()
  }
}));

const mockQuery = pool.query as jest.Mock;

describe("loading docks service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates a dock to occupied with an order", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "dock-1" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "dock-1",
            status: "FREE",
            current_order_id: null,
            max_tonnage: 18,
            max_width_meters: 2.8
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "dock-1",
            status: "OCCUPIED",
            current_order_id: "order-1"
          }
        ]
      });

    const result = await patchLoadingDock(
      "dock-1",
      {
        status: "OCCUPIED",
        current_order_id: "order-1"
      },
      {
        id: "client-1",
        role: "client"
      }
    );

    expect(result.status).toBe("OCCUPIED");
    expect(result.current_order_id).toBe("order-1");
  });

  it("clears current_order_id when dock becomes free", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "dock-1" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "dock-1",
            status: "OCCUPIED",
            current_order_id: "order-1",
            max_tonnage: 18,
            max_width_meters: 2.8
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "dock-1",
            status: "FREE",
            current_order_id: null
          }
        ]
      });

    const result = await patchLoadingDock(
      "dock-1",
      {
        status: "FREE"
      },
      {
        id: "client-1",
        role: "client"
      }
    );

    expect(result.status).toBe("FREE");
    expect(result.current_order_id).toBeNull();
  });
});
