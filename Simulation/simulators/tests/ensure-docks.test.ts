/// <reference types="jest" />

import { ensureDocks, DEFAULT_DOCKS } from "../merchant/warehouse/register-stock";
import { ApiClient } from "../shared/api-client";

function mockClient(existingCodes: string[] | "error"): {
  client: ApiClient;
  posted: Array<{ path: string; body: unknown }>;
} {
  const posted: Array<{ path: string; body: unknown }> = [];
  const client = {
    get: jest.fn().mockImplementation(async () => {
      if (existingCodes === "error") throw new Error("exterior 404");
      return { docks: existingCodes.map((code, i) => ({ id: `d${i}`, code, status: "FREE" })) };
    }),
    post: jest.fn().mockImplementation(async (path: string, body: unknown) => {
      posted.push({ path, body });
      return { id: `new-${posted.length}`, code: (body as any).code };
    })
  } as unknown as ApiClient;
  return { client, posted };
}

describe("ensureDocks", () => {
  it("crée tous les docks quand aucun n'existe", async () => {
    const { client, posted } = mockClient([]);

    const created = await ensureDocks(client, "wh-1", DEFAULT_DOCKS);

    expect(created).toBe(DEFAULT_DOCKS.length);
    expect(posted).toHaveLength(DEFAULT_DOCKS.length);
    expect(posted[0].path).toBe("/api/client-warehouses/wh-1/loading-docks");
    expect(posted.map((p) => (p.body as any).code)).toEqual(
      DEFAULT_DOCKS.map((d) => d.code)
    );
  });

  it("ne recrée pas un dock déjà présent (idempotent par code)", async () => {
    const { client, posted } = mockClient(["D1", "D2", "D3"]);

    const created = await ensureDocks(client, "wh-1", DEFAULT_DOCKS);

    expect(created).toBe(0);
    expect(posted).toHaveLength(0);
  });

  it("crée uniquement les docks manquants", async () => {
    const { client, posted } = mockClient(["D1"]);

    const created = await ensureDocks(client, "wh-1", DEFAULT_DOCKS);

    expect(created).toBe(2);
    expect(posted.map((p) => (p.body as any).code)).toEqual(["D2", "D3"]);
  });

  it("retombe sur création complète si GET /exterior échoue", async () => {
    const { client, posted } = mockClient("error");

    const created = await ensureDocks(client, "wh-1", DEFAULT_DOCKS);

    expect(created).toBe(DEFAULT_DOCKS.length);
    expect(posted).toHaveLength(DEFAULT_DOCKS.length);
  });

  it("accepte une liste de docks custom", async () => {
    const customDocks = [
      { code: "X1", position_x: 0, position_y: 0, side: "S" as const, max_tonnage: 30 }
    ];
    const { client, posted } = mockClient([]);

    await ensureDocks(client, "wh-1", customDocks);

    expect(posted).toHaveLength(1);
    expect((posted[0].body as any).code).toBe("X1");
    expect((posted[0].body as any).side).toBe("S");
    expect((posted[0].body as any).max_tonnage).toBe(30);
  });
});
