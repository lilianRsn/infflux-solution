import { ApiClient, ApiError } from "../shared/api-client";
import { loadEnv } from "../shared/config";
import { makeLogger } from "../shared/logger";
import { makeRng } from "../shared/rng";
import { login } from "../shared/auth";
import { runTicks } from "../shared/tick-loop";
import { LogisticsScenario } from "./scenarios/default";

export interface LogisticsReport {
  scenario: string;
  ticks: number;
  plans_generes: number;
  plans_completes: number;
  duree_ms: number;
}

interface DeliveryPlan {
  id: string;
  status: "DRAFT" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
  planned_delivery_date: string;
  created_at: string;
}

export async function runLogistics(scenario: LogisticsScenario): Promise<LogisticsReport> {
  const env = loadEnv();
  const log = makeLogger({ actor: "logistics", scenario: scenario.nom });
  const rng = makeRng(scenario.seed);
  const client = new ApiClient({ baseUrl: env.backendUrl });

  const start = Date.now();
  let plansGeneres = 0;
  let plansCompletes = 0;
  let ticksExecutes = 0;

  // Stockage local pour simuler le transit
  const plansEnTransit: Map<string, number> = new Map(); // planId -> timestamp de complétion attendu

  let shutdownRequested = false;
  const onSignal = (signal: NodeJS.Signals) => {
    if (shutdownRequested) return;
    shutdownRequested = true;
    log.info("shutdown_signal", { signal });
  };
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);

  log.info("boot", { backend: env.backendUrl, seed: scenario.seed });

  // 1. Authentification
  const auth = await login(client, scenario.credentials.email, scenario.credentials.password);
  log.info("authenticated", { user_id: auth.user.id, role: auth.user.role });

  // 2. Initialisation : Camions
  const trucks = await client.get<any[]>("/api/trucks");
  if (trucks.length < scenario.trucks.min_count) {
    const toCreate = rng.intBetween(scenario.trucks.min_count, scenario.trucks.max_count) - trucks.length;
    log.info("creating_trucks", { count: toCreate });
    for (let i = 0; i < toCreate; i++) {
      await client.post("/api/trucks", {
        code: `TRK-${rng.intBetween(1000, 9999)}`,
        max_pallets: rng.intBetween(scenario.trucks.pallet_capacity_min, scenario.trucks.pallet_capacity_max),
        max_volume_m3: 80,
        max_weight_kg: 24000,
        status: "AVAILABLE"
      });
    }
  }

  // 3. Boucle de simulation
  await runTicks({
    nbTicks: scenario.nb_ticks,
    tickRateMs: scenario.tick_rate_ms,
    shouldStop: () => shutdownRequested,
    onTick: async ({ tick }) => {
      ticksExecutes = tick;
      const tlog = log.withTick(tick);

      // A. Générer des plans de livraison
      try {
        const genRes = await client.post<any>("/api/delivery-plans/generate", {});
        if (genRes.generated_count > 0) {
          plansGeneres += genRes.generated_count;
          tlog.info("plans_generated", { count: genRes.generated_count, plans: genRes.generated_plans });
        }
      } catch (err) {
        tlog.error("generation_error", { message: err instanceof Error ? err.message : String(err) });
      }

      // B. Gérer le cycle de vie des plans
      try {
        const allPlans = await client.get<DeliveryPlan[]>("/api/delivery-plans");
        const now = Date.now();

        for (const plan of allPlans) {
          if (plan.status === "DRAFT") {
            // Passer en CONFIRMED immédiatement
            await client.patch(`/api/delivery-plans/${plan.id}/status`, { status: "CONFIRMED" });
            tlog.info("plan_confirmed", { plan_id: plan.id });
          } 
          else if (plan.status === "CONFIRMED") {
            // Passer en IN_PROGRESS et démarrer le "transit"
            await client.patch(`/api/delivery-plans/${plan.id}/status`, { status: "IN_PROGRESS" });
            plansEnTransit.set(plan.id, now + scenario.simulated_day_duration_ms);
            tlog.info("plan_in_progress", { plan_id: plan.id, eta: new Date(now + scenario.simulated_day_duration_ms).toISOString() });
          }
          else if (plan.status === "IN_PROGRESS") {
            const completionTime = plansEnTransit.get(plan.id);
            if (completionTime && now >= completionTime) {
              // Livraison terminée !
              await client.patch(`/api/delivery-plans/${plan.id}/status`, { status: "COMPLETED" });
              plansEnTransit.delete(plan.id);
              plansCompletes++;
              tlog.info("plan_completed", { plan_id: plan.id });
            }
          }
        }
      } catch (err) {
        tlog.error("lifecycle_error", { message: err instanceof Error ? err.message : String(err) });
      }
    }
  });

  const report: LogisticsReport = {
    scenario: scenario.nom,
    ticks: ticksExecutes,
    plans_generes: plansGeneres,
    plans_completes: plansCompletes,
    duree_ms: Date.now() - start
  };

  log.info("fin", { ...report });
  return report;
}
