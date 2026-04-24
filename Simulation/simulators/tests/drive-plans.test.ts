/// <reference types="jest" />

import { daysBetween, runDrivePlansCycle, InProgressTrack } from "../fleet/behaviors/drive-plans";
import { ApiClient } from "../shared/api-client";
import { makeLogger, Logger } from "../shared/logger";
import { DeliveryPlanSummary, GenerateDeliveryPlansResult } from "../shared/delivery-plans-api";

function silentLogger(): Logger {
  const noop = () => {};
  return {
    info: noop,
    warn: noop,
    error: noop,
    debug: noop,
    withTick: () => silentLogger()
  } as unknown as Logger;
}

function makePlan(partial: Partial<DeliveryPlanSummary> & { id: string }): DeliveryPlanSummary {
  return {
    planned_delivery_date: "2026-04-27",
    planned_time_window: "morning",
    client_warehouse_id: "wh",
    client_warehouse_name: "Entrepot",
    status: "DRAFT",
    total_pallets: 10,
    priority_score: 50,
    orders_count: 1,
    trucks_count: 1,
    docks_count: 1,
    ...partial
  };
}

interface MockDeps {
  generate: GenerateDeliveryPlansResult;
  list: DeliveryPlanSummary[];
  generateThrows?: boolean;
  listThrows?: boolean;
}

function mockClient(mocks: MockDeps): {
  client: ApiClient;
  patches: Array<{ planId: string; status: string }>;
} {
  const patches: Array<{ planId: string; status: string }> = [];
  const client = {
    get: jest.fn().mockImplementation(async (path: string) => {
      if (path === "/api/delivery-plans") {
        if (mocks.listThrows) throw new Error("list failed");
        return mocks.list;
      }
      throw new Error(`unexpected GET ${path}`);
    }),
    post: jest.fn().mockImplementation(async (path: string) => {
      if (path === "/api/delivery-plans/generate") {
        if (mocks.generateThrows) throw new Error("generate failed");
        return mocks.generate;
      }
      throw new Error(`unexpected POST ${path}`);
    }),
    patch: jest.fn().mockImplementation(async (path: string, body: { status: string }) => {
      const m = path.match(/\/api\/delivery-plans\/([^/]+)\/status/);
      if (!m) throw new Error(`unexpected PATCH ${path}`);
      patches.push({ planId: m[1], status: body.status });
      return { id: m[1], status: body.status };
    })
  } as unknown as ApiClient;
  return { client, patches };
}

const EMPTY_GEN: GenerateDeliveryPlansResult = {
  generated_count: 0,
  blocked_count: 0,
  partially_planned_count: 0,
  generated_plans: [],
  blocked_orders: [],
  partially_planned_orders: []
};

describe("daysBetween", () => {
  it("retourne 0 pour la même date", () => {
    expect(daysBetween("2026-04-24", "2026-04-24")).toBe(0);
  });

  it("compte correctement des jours positifs", () => {
    expect(daysBetween("2026-04-24", "2026-04-27")).toBe(3);
    expect(daysBetween("2026-04-01", "2026-05-01")).toBe(30);
  });

  it("retourne 0 pour une date passée (jamais négatif)", () => {
    expect(daysBetween("2026-04-24", "2026-04-20")).toBe(0);
  });
});

describe("runDrivePlansCycle", () => {
  it("passe les plans DRAFT en IN_PROGRESS et les track", async () => {
    const plan = makePlan({ id: "plan-1", status: "DRAFT", planned_delivery_date: "2026-04-27" });
    const { client, patches } = mockClient({ generate: EMPTY_GEN, list: [plan] });
    const inflight = new Map<string, InProgressTrack>();
    const today = new Date("2026-04-24T10:00:00Z").getTime();

    const result = await runDrivePlansCycle(
      {
        client,
        log: silentLogger(),
        now: () => today,
        minute_par_jour_ms: 60000
      },
      inflight
    );

    expect(result.started).toBe(1);
    expect(result.completed).toBe(0);
    expect(patches).toEqual([{ planId: "plan-1", status: "IN_PROGRESS" }]);
    expect(inflight.get("plan-1")).toBeDefined();
    expect(inflight.get("plan-1")!.days_from_start).toBe(3);
    expect(inflight.get("plan-1")!.completes_at_ms).toBe(today + 3 * 60000);
  });

  it("ne redémarre pas un plan DRAFT déjà tracké", async () => {
    const plan = makePlan({ id: "plan-1", status: "DRAFT" });
    const { client, patches } = mockClient({ generate: EMPTY_GEN, list: [plan] });
    const inflight = new Map<string, InProgressTrack>([
      [
        "plan-1",
        {
          plan_id: "plan-1",
          started_at_ms: 0,
          completes_at_ms: Number.MAX_SAFE_INTEGER,
          planned_delivery_date: "2026-04-27",
          days_from_start: 3
        }
      ]
    ]);

    await runDrivePlansCycle(
      { client, log: silentLogger(), now: () => 0, minute_par_jour_ms: 60000 },
      inflight
    );

    expect(patches).toEqual([]);
  });

  it("ignore les plans qui ne sont pas en DRAFT", async () => {
    const plans = [
      makePlan({ id: "p1", status: "CONFIRMED" }),
      makePlan({ id: "p2", status: "IN_PROGRESS" }),
      makePlan({ id: "p3", status: "COMPLETED" }),
      makePlan({ id: "p4", status: "BLOCKED" })
    ];
    const { client, patches } = mockClient({ generate: EMPTY_GEN, list: plans });

    const result = await runDrivePlansCycle(
      { client, log: silentLogger(), now: () => 0, minute_par_jour_ms: 60000 },
      new Map()
    );

    expect(result.started).toBe(0);
    expect(patches).toEqual([]);
  });

  it("passe un plan en COMPLETED quand l'échéance simulée est atteinte", async () => {
    const plan = makePlan({ id: "plan-1", status: "IN_PROGRESS" });
    const { client, patches } = mockClient({ generate: EMPTY_GEN, list: [plan] });
    const inflight = new Map<string, InProgressTrack>([
      [
        "plan-1",
        {
          plan_id: "plan-1",
          started_at_ms: 1000,
          completes_at_ms: 2000,
          planned_delivery_date: "2026-04-27",
          days_from_start: 3
        }
      ]
    ]);

    const result = await runDrivePlansCycle(
      { client, log: silentLogger(), now: () => 2500, minute_par_jour_ms: 60000 },
      inflight
    );

    expect(result.completed).toBe(1);
    expect(patches).toEqual([{ planId: "plan-1", status: "COMPLETED" }]);
    expect(inflight.has("plan-1")).toBe(false);
  });

  it("ne complète pas un plan avant son échéance", async () => {
    const plan = makePlan({ id: "plan-1", status: "IN_PROGRESS" });
    const { client, patches } = mockClient({ generate: EMPTY_GEN, list: [plan] });
    const inflight = new Map<string, InProgressTrack>([
      [
        "plan-1",
        {
          plan_id: "plan-1",
          started_at_ms: 1000,
          completes_at_ms: 5000,
          planned_delivery_date: "2026-04-27",
          days_from_start: 3
        }
      ]
    ]);

    const result = await runDrivePlansCycle(
      { client, log: silentLogger(), now: () => 3000, minute_par_jour_ms: 60000 },
      inflight
    );

    expect(result.completed).toBe(0);
    expect(patches).toEqual([]);
    expect(inflight.has("plan-1")).toBe(true);
  });

  it("continue même quand generate échoue", async () => {
    const plan = makePlan({ id: "p1", status: "DRAFT" });
    const { client, patches } = mockClient({
      generate: EMPTY_GEN,
      list: [plan],
      generateThrows: true
    });

    const result = await runDrivePlansCycle(
      { client, log: silentLogger(), now: () => 0, minute_par_jour_ms: 60000 },
      new Map()
    );

    expect(result.generated).toBe(0);
    expect(result.started).toBe(1);
    expect(patches).toEqual([{ planId: "p1", status: "IN_PROGRESS" }]);
  });

  it("sort proprement quand list échoue (pas de patch tenté)", async () => {
    const { client, patches } = mockClient({
      generate: EMPTY_GEN,
      list: [],
      listThrows: true
    });

    const result = await runDrivePlansCycle(
      { client, log: silentLogger(), now: () => 0, minute_par_jour_ms: 60000 },
      new Map()
    );

    expect(result.started).toBe(0);
    expect(result.completed).toBe(0);
    expect(patches).toEqual([]);
  });

  it("reflète le nombre de plans en cours dans result.pending", async () => {
    const { client } = mockClient({ generate: EMPTY_GEN, list: [] });
    const inflight = new Map<string, InProgressTrack>([
      ["p1", { plan_id: "p1", started_at_ms: 0, completes_at_ms: Number.MAX_SAFE_INTEGER, planned_delivery_date: "2026-05-01", days_from_start: 10 }],
      ["p2", { plan_id: "p2", started_at_ms: 0, completes_at_ms: Number.MAX_SAFE_INTEGER, planned_delivery_date: "2026-05-01", days_from_start: 10 }]
    ]);

    const result = await runDrivePlansCycle(
      { client, log: silentLogger(), now: () => 100, minute_par_jour_ms: 60000 },
      inflight
    );

    expect(result.pending).toBe(2);
  });
});
