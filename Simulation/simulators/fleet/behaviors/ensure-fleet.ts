import { ApiClient } from "../../shared/api-client";
import { Rng } from "../../shared/rng";
import { createTruck, listTrucks, Truck } from "../../shared/trucks-api";
import { FleetScenario } from "../scenarios/default";

export interface EnsureFleetResult {
  existing: number;
  created: number;
  trucks: Truck[];
}

export async function ensureFleet(
  client: ApiClient,
  rng: Rng,
  scenario: FleetScenario
): Promise<EnsureFleetResult> {
  const existingTrucks = await listTrucks(client);
  const owned = existingTrucks.filter((t) =>
    t.name.startsWith(scenario.fleet.name_prefix + "-")
  );

  const target = rng.intBetween(
    scenario.fleet.nb_trucks_min,
    scenario.fleet.nb_trucks_max
  );

  if (owned.length >= target) {
    return { existing: owned.length, created: 0, trucks: owned };
  }

  const toCreate = target - owned.length;
  const usedIndexes = new Set(
    owned
      .map((t) => {
        const match = t.name.match(/-(\d+)$/);
        return match ? Number(match[1]) : null;
      })
      .filter((n): n is number => n !== null)
  );

  const created: Truck[] = [];
  let nextIndex = 1;

  for (let i = 0; i < toCreate; i++) {
    while (usedIndexes.has(nextIndex)) nextIndex++;
    usedIndexes.add(nextIndex);

    const palettes = rng.intBetween(
      scenario.fleet.max_palettes_min,
      scenario.fleet.max_palettes_max
    );

    const truck = await createTruck(client, {
      name: `${scenario.fleet.name_prefix}-${String(nextIndex).padStart(3, "0")}`,
      license_plate: `${scenario.fleet.plate_prefix}-${String(nextIndex).padStart(3, "0")}-${randomLetters(rng, 2)}`,
      max_palettes: palettes,
      max_weight_kg: scenario.fleet.max_weight_kg,
      max_volume_m3: scenario.fleet.max_volume_m3,
      status: "AVAILABLE"
    });
    created.push(truck);
    nextIndex++;
  }

  return {
    existing: owned.length,
    created: created.length,
    trucks: [...owned, ...created]
  };
}

function randomLetters(rng: Rng, n: number): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let out = "";
  for (let i = 0; i < n; i++) out += alphabet[rng.intBetween(0, 25)];
  return out;
}
