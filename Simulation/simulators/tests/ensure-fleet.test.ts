/// <reference types="jest" />

import { ensureFleet } from "../fleet/behaviors/ensure-fleet";
import { makeRng } from "../shared/rng";
import { ApiClient } from "../shared/api-client";
import { Truck } from "../shared/trucks-api";
import { FleetScenario } from "../fleet/scenarios/default";

function makeScenario(overrides: Partial<FleetScenario["fleet"]> = {}): FleetScenario {
  return {
    nom: "test",
    seed: 42,
    nb_ticks: 1,
    tick_rate_ms: 1000,
    credentials: { email: "a@b.c", password: "x" },
    identity: { company_name: "X" },
    fleet: {
      nb_trucks_min: 3,
      nb_trucks_max: 3,
      name_prefix: "TEST",
      plate_prefix: "TX",
      max_palettes_min: 20,
      max_palettes_max: 20,
      max_weight_kg: 10000,
      max_volume_m3: 20,
      ...overrides
    },
    minute_par_jour_ms: 60000
  };
}

function makeTruck(partial: Partial<Truck> & { name: string }): Truck {
  return {
    id: `id-${partial.name}`,
    license_plate: "XX-000-AA",
    max_palettes: 20,
    max_weight_kg: 10000,
    max_volume_m3: 20,
    status: "AVAILABLE",
    current_route: null,
    fill_percent: 0,
    driver_name: null,
    notes: null,
    ...partial
  };
}

function mockClient(opts: {
  existing: Truck[];
  onCreate: (body: unknown) => Truck;
}): { client: ApiClient; created: Truck[] } {
  const created: Truck[] = [];
  const client = {
    get: jest.fn().mockResolvedValue(opts.existing),
    post: jest.fn().mockImplementation(async (_path: string, body: unknown) => {
      const t = opts.onCreate(body);
      created.push(t);
      return t;
    })
  } as unknown as ApiClient;
  return { client, created };
}

describe("ensureFleet", () => {
  it("crée exactement target camions quand la liste est vide", async () => {
    const scenario = makeScenario({ nb_trucks_min: 4, nb_trucks_max: 4 });
    let counter = 0;
    const { client, created } = mockClient({
      existing: [],
      onCreate: (body: any) => makeTruck({ name: body.name, id: `new-${++counter}` })
    });

    const result = await ensureFleet(client, makeRng(1), scenario);

    expect(result.created).toBe(4);
    expect(result.existing).toBe(0);
    expect(result.trucks).toHaveLength(4);
    expect(created.map((t) => t.name)).toEqual([
      "TEST-001",
      "TEST-002",
      "TEST-003",
      "TEST-004"
    ]);
  });

  it("réutilise les camions existants portant le bon préfixe", async () => {
    const scenario = makeScenario({ nb_trucks_min: 3, nb_trucks_max: 3 });
    const existing = [
      makeTruck({ name: "TEST-001" }),
      makeTruck({ name: "TEST-002" })
    ];
    const { client, created } = mockClient({
      existing,
      onCreate: (body: any) => makeTruck({ name: body.name })
    });

    const result = await ensureFleet(client, makeRng(1), scenario);

    expect(result.existing).toBe(2);
    expect(result.created).toBe(1);
    expect(result.trucks).toHaveLength(3);
    expect(created).toHaveLength(1);
    expect(created[0].name).toBe("TEST-003");
  });

  it("ignore les camions d'autres flottes (préfixe différent)", async () => {
    const scenario = makeScenario({ nb_trucks_min: 2, nb_trucks_max: 2 });
    const existing = [
      makeTruck({ name: "OTHER-001" }),
      makeTruck({ name: "OTHER-002" })
    ];
    const { client, created } = mockClient({
      existing,
      onCreate: (body: any) => makeTruck({ name: body.name })
    });

    const result = await ensureFleet(client, makeRng(1), scenario);

    expect(result.existing).toBe(0);
    expect(result.created).toBe(2);
    expect(created.map((t) => t.name)).toEqual(["TEST-001", "TEST-002"]);
  });

  it("ne crée rien si on a déjà atteint ou dépassé la cible", async () => {
    const scenario = makeScenario({ nb_trucks_min: 2, nb_trucks_max: 2 });
    const existing = [
      makeTruck({ name: "TEST-001" }),
      makeTruck({ name: "TEST-002" }),
      makeTruck({ name: "TEST-003" })
    ];
    const { client, created } = mockClient({
      existing,
      onCreate: () => makeTruck({ name: "NOPE" })
    });

    const result = await ensureFleet(client, makeRng(1), scenario);

    expect(result.created).toBe(0);
    expect(created).toHaveLength(0);
    expect(result.trucks).toHaveLength(3);
  });

  it("évite les collisions d'index quand des trous existent", async () => {
    const scenario = makeScenario({ nb_trucks_min: 4, nb_trucks_max: 4 });
    const existing = [
      makeTruck({ name: "TEST-002" }),
      makeTruck({ name: "TEST-005" })
    ];
    const { client, created } = mockClient({
      existing,
      onCreate: (body: any) => makeTruck({ name: body.name })
    });

    await ensureFleet(client, makeRng(1), scenario);

    expect(created.map((t) => t.name).sort()).toEqual(["TEST-001", "TEST-003"]);
  });

  it("génère une plaque au format <prefix>-<index>-<2 lettres>", async () => {
    const scenario = makeScenario({ nb_trucks_min: 1, nb_trucks_max: 1 });
    const { client, created } = mockClient({
      existing: [],
      onCreate: (body: any) => makeTruck({ name: body.name, license_plate: body.license_plate })
    });

    await ensureFleet(client, makeRng(7), scenario);

    expect(created[0].license_plate).toMatch(/^TX-001-[A-Z]{2}$/);
  });
});
