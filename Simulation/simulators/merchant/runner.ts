import { ApiClient, ApiError } from "../shared/api-client";
import { loadEnv } from "../shared/config";
import { makeLogger } from "../shared/logger";
import { makeRng } from "../shared/rng";
import { registerIfNew, login } from "../shared/auth";
import { runTicks } from "../shared/tick-loop";

import { MerchantScenario } from "./scenarios/default";
import { buildStock, consommerCartons } from "./storage/build";
import { totalCartonsParProduit } from "./storage/convert";
import { snapshotStock } from "./behaviors/snapshot-stock";
import { buildCreateOrderBody, productsBelowThreshold } from "./behaviors/submit-order";

export interface RunReport {
  scenario: string;
  ticks: number;
  commandes_envoyees: number;
  commandes_succes: number;
  commandes_echecs: number;
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

  log.info("boot", { backend: env.backendUrl, seed: scenario.seed });

  const registerStatus = await registerIfNew(client, {
    email: scenario.credentials.email,
    password: scenario.credentials.password,
    role: "client",
    company_name: scenario.identity.company_name,
    billing_address: scenario.identity.billing_address,
    main_contact_name: scenario.identity.main_contact_name,
    main_contact_phone: scenario.identity.main_contact_phone,
    main_contact_email: scenario.identity.main_contact_email
  });
  log.info("register", { status: registerStatus });

  const loginRes = await login(
    client,
    scenario.credentials.email,
    scenario.credentials.password
  );
  log.info("login", { user_id: loginRes.user.id, role: loginRes.user.role });

  const stock = buildStock(rng, scenario.stock_init);
  log.info("stock_initial", { snapshot: snapshotStock(stock) });

  await runTicks({
    nbTicks: scenario.nb_ticks,
    tickRateMs: scenario.tick_rate_ms,
    onTick: async ({ tick }) => {
      const tlog = log.withTick(tick);

      if (rng.bernoulli(scenario.proba_consommation_par_tick)) {
        const produits = Object.keys(totalCartonsParProduit(stock));
        if (produits.length > 0) {
          const produit = rng.pick(produits);
          const qte = rng.intBetween(
            scenario.cartons_consommes_par_tick_min,
            scenario.cartons_consommes_par_tick_max
          );
          const pris = consommerCartons(stock, produit, qte);
          tlog.info("consommation", { produit_id: produit, cartons_consommes: pris });
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
        now: new Date()
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
          lignes: body.order_lines
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
    ticks: scenario.nb_ticks,
    commandes_envoyees: commandesEnvoyees,
    commandes_succes: commandesSucces,
    commandes_echecs: commandesEchecs,
    duree_ms: Date.now() - start
  };

  log.info("fin", { ...report });
  log.info("stock_final", { snapshot: snapshotStock(stock) });

  return report;
}
