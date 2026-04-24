import { ApiClient, ApiError } from "../shared/api-client";
import { loadEnv } from "../shared/config";
import { makeLogger } from "../shared/logger";
import { makeRng } from "../shared/rng";
import { ensureAuthenticated } from "../shared/auth";
import { runTicks } from "../shared/tick-loop";

import { MerchantScenario } from "./scenarios/default";
import { buildStock, consommerCartons } from "./storage/build";
import { totalCartonsParProduit } from "./storage/convert";
import { snapshotStock } from "./behaviors/snapshot-stock";
import { buildCreateOrderBody, productsBelowThreshold } from "./behaviors/submit-order";
import { ensureStockRegistration } from "./warehouse/ensure-stock";
import { syncSlot } from "./warehouse/sync-slot";
import { StockMarchand, Rangee } from "./storage/model";

export interface RunReport {
  scenario: string;
  ticks: number;
  commandes_envoyees: number;
  commandes_succes: number;
  commandes_echecs: number;
  slots_synchronises: number;
  duree_ms: number;
}

export async function runMerchant(scenario: MerchantScenario): Promise<RunReport> {
  const env = loadEnv();
  const log = makeLogger({ actor: "merchant", scenario: scenario.nom });
  const rng = makeRng(scenario.seed);
  const client = new ApiClient({ baseUrl: env.backendUrl });

  const start = Date.now();
  let commandesEnvoyees = 0;
  let commandesSucces = 0;
  let commandesEchecs = 0;
  let slotsSynchronises = 0;
  let ticksExecutes = 0;

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
    role: "client",
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

  const stock = buildStock(rng, scenario.stock_init);
  log.info("stock_initial", { snapshot: snapshotStock(stock) });

  const registration = await ensureStockRegistration(
    client,
    stock,
    scenario.warehouse,
    auth.user.id
  );
  log.info("stock_registered", {
    reused: registration.reused,
    warehouse_id: registration.warehouse_id,
    floor_id: registration.floor_id,
    aisles: registration.aisle_ids,
    slots: registration.slot_ids
  });

  await runTicks({
    nbTicks: scenario.nb_ticks,
    tickRateMs: scenario.tick_rate_ms,
    shouldStop: () => shutdownRequested,
    onTick: async ({ tick }) => {
      ticksExecutes = tick;
      const tlog = log.withTick(tick);

      if (rng.bernoulli(scenario.proba_consommation_par_tick)) {
        const produits = Object.keys(totalCartonsParProduit(stock));
        if (produits.length > 0) {
          const produit = rng.pick(produits);
          const qte = rng.intBetween(
            scenario.cartons_consommes_par_tick_min,
            scenario.cartons_consommes_par_tick_max
          );
          const res = consommerCartons(stock, produit, qte);
          tlog.info("consommation", {
            produit_id: produit,
            cartons_consommes: res.cartons_consommes,
            rangees_modifiees: res.rangees_modifiees
          });

          for (const rangeeId of res.rangees_modifiees) {
            const rangee = findRangee(stock, rangeeId);
            const slotId = registration.slot_ids[rangeeId];
            if (!rangee || !slotId) continue;
            try {
              await syncSlot(client, {
                stock,
                rangee,
                slotId,
                m3_par_carton: scenario.warehouse.m3_par_carton
              });
              slotsSynchronises++;
              tlog.info("slot_synchronise", { rangee_id: rangeeId, slot_id: slotId });
            } catch (err) {
              tlog.error("slot_sync_erreur", {
                rangee_id: rangeeId,
                slot_id: slotId,
                message: err instanceof Error ? err.message : String(err)
              });
            }
          }
        }
      }

      const manquants = productsBelowThreshold(stock, scenario.order_policy.seuil_commande_cartons);
      if (manquants.length === 0) {
        tlog.debug("stock_ok", {});
        return;
      }
      tlog.info("seuil_atteint", { manquants });

      const body = buildCreateOrderBody({
        stock,
        identity: scenario.identity,
        destination: scenario.destination,
        policy: scenario.order_policy,
        now: new Date(),
        rng,
        client_warehouse_id: registration.warehouse_id
      });

      if (!body) {
        tlog.debug("aucune_ligne_a_commander", {});
        return;
      }

      commandesEnvoyees++;
      try {
        const res = await client.post<{ order: { order_id: string; order_number: string } }>(
          "/api/orders",
          body
        );
        commandesSucces++;
        tlog.info("commande_envoyee", {
          order_id: res.order.order_id,
          order_number: res.order.order_number,
          lignes: body.order_lines,
          delivery_time_window: body.delivery_need.delivery_time_window,
          urgency_level: body.delivery_need.urgency_level,
          requested_delivery_date: body.delivery_need.requested_delivery_date
        });
      } catch (err) {
        commandesEchecs++;
        if (err instanceof ApiError) {
          tlog.error("commande_erreur", { status: err.status, body: err.body });
        } else {
          tlog.error("commande_erreur", { message: err instanceof Error ? err.message : String(err) });
        }
      }
    }
  });

  const report: RunReport = {
    scenario: scenario.nom,
    ticks: ticksExecutes,
    commandes_envoyees: commandesEnvoyees,
    commandes_succes: commandesSucces,
    commandes_echecs: commandesEchecs,
    slots_synchronises: slotsSynchronises,
    duree_ms: Date.now() - start
  };

  log.info("fin", { ...report });
  log.info("stock_final", { snapshot: snapshotStock(stock) });

  return report;
}

function findRangee(stock: StockMarchand, rangeeId: string): Rangee | undefined {
  for (const allee of stock.allees) {
    const r = allee.rangees.find((x) => x.rangee_id === rangeeId);
    if (r) return r;
  }
  return undefined;
}
