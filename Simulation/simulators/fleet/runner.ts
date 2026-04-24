import { ApiClient } from "../shared/api-client";
import { loadEnv } from "../shared/config";
import { makeLogger } from "../shared/logger";
import { makeRng } from "../shared/rng";
import { ensureAuthenticated } from "../shared/auth";
import { runTicks } from "../shared/tick-loop";

import { FleetScenario } from "./scenarios/default";
import { ensureFleet } from "./behaviors/ensure-fleet";
import { InProgressTrack, runDrivePlansCycle } from "./behaviors/drive-plans";

export interface FleetRunReport {
  scenario: string;
  ticks: number;
  trucks_total: number;
  plans_started: number;
  plans_completed: number;
  plans_generated_total: number;
  duree_ms: number;
}

export async function runFleet(scenario: FleetScenario): Promise<FleetRunReport> {
  const env = loadEnv();
  const log = makeLogger({ actor: "fleet", scenario: scenario.nom });
  const rng = makeRng(scenario.seed);
  const client = new ApiClient({ baseUrl: env.backendUrl });

  const start = Date.now();
  let ticksExecutes = 0;
  let plansStarted = 0;
  let plansCompleted = 0;
  let plansGenerated = 0;

  let shutdownRequested = false;
  const onSignal = (signal: NodeJS.Signals) => {
    if (shutdownRequested) return;
    shutdownRequested = true;
    log.info("shutdown_signal", { signal });
  };
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);

  log.info("boot", { backend: env.backendUrl, seed: scenario.seed });

  const auth = await ensureAuthenticated(client, {
    email: scenario.credentials.email,
    password: scenario.credentials.password,
    role: "admin",
    company_name: scenario.identity.company_name,
    billing_address: scenario.identity.billing_address,
    main_contact_name: scenario.identity.main_contact_name,
    main_contact_phone: scenario.identity.main_contact_phone,
    main_contact_email: scenario.identity.main_contact_email
  });
  log.info("authenticated", {
    outcome: auth.outcome,
    user_id: auth.user.id,
    role: auth.user.role
  });

  if (auth.user.role !== "admin") {
    throw new Error(
      `fleet simulator requires admin role but user has role=${auth.user.role}`
    );
  }

  const fleetResult = await ensureFleet(client, rng, scenario);
  log.info("fleet_ready", {
    trucks_total: fleetResult.trucks.length,
    existing: fleetResult.existing,
    created: fleetResult.created,
    trucks: fleetResult.trucks.map((t) => ({
      id: t.id,
      name: t.name,
      plate: t.license_plate,
      max_palettes: t.max_palettes,
      status: t.status
    }))
  });

  const inflight = new Map<string, InProgressTrack>();

  await runTicks({
    nbTicks: scenario.nb_ticks,
    tickRateMs: scenario.tick_rate_ms,
    shouldStop: () => shutdownRequested,
    onTick: async ({ tick }) => {
      ticksExecutes = tick;
      const tlog = log.withTick(tick);

      const cycle = await runDrivePlansCycle(
        {
          client,
          log: tlog,
          now: () => Date.now(),
          minute_par_jour_ms: scenario.minute_par_jour_ms
        },
        inflight
      );

      plansGenerated += cycle.generated;
      plansStarted += cycle.started;
      plansCompleted += cycle.completed;

      tlog.info("tick_summary", {
        generated: cycle.generated,
        started: cycle.started,
        completed: cycle.completed,
        inflight: cycle.pending
      });
    }
  });

  const report: FleetRunReport = {
    scenario: scenario.nom,
    ticks: ticksExecutes,
    trucks_total: fleetResult.trucks.length,
    plans_started: plansStarted,
    plans_completed: plansCompleted,
    plans_generated_total: plansGenerated,
    duree_ms: Date.now() - start
  };

  log.info("fin", { ...report });
  return report;
}
