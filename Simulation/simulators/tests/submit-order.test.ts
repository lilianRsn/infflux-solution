/// <reference types="jest" />

import {
  buildCreateOrderBody,
  productsBelowThreshold,
  OrderPolicy,
  MerchantIdentity,
  DeliveryDestination
} from "../merchant/behaviors/submit-order";
import { StockMarchand } from "../merchant/storage/model";
import { makeRng } from "../shared/rng";

const identity: MerchantIdentity = {
  company_name: "Marchand A",
  billing_address: "12 rue Exemple, Paris",
  main_contact_name: "Jean Dupont",
  main_contact_phone: "0600000000",
  main_contact_email: "jean@clienta.fr"
};

const destination: DeliveryDestination = {
  delivery_address: "25 avenue Livraison, Lyon",
  site_name: "Magasin Lyon"
};

const policy: OrderPolicy = {
  seuil_commande_cartons: 20,
  quantite_cible_cartons: 100,
  facteur_quantite_max: 1.5,
  min_produits_par_commande: 1,
  max_produits_par_commande: 3,
  horizon_livraison_jours_min: 3,
  horizon_livraison_jours_max: 8,
  time_windows_pool: ["morning", "afternoon", "full_day"],
  urgency_levels_pool: ["flexible", "standard"],
  grouped_delivery_allowed: true,
  partner_delivery_allowed: true,
  can_receive_early: true,
  can_store_early_delivery: true
};

function makeStock(partial: Record<string, number>): StockMarchand {
  return {
    marchand_id: "m",
    cartons_par_palette: 32,
    allees: [
      {
        allee_id: "A1",
        rangees: [
          {
            rangee_id: "A1-R1",
            capacite_cartons: 200,
            cartons: Object.entries(partial).map(([produit_id, quantite_cartons]) => ({
              produit_id,
              quantite_cartons
            }))
          }
        ]
      }
    ]
  };
}

describe("productsBelowThreshold", () => {
  it("retourne la liste des produits sous le seuil, triée par manque décroissant", () => {
    const stock = makeStock({ P1: 5, P2: 50, P3: 15 });
    const res = productsBelowThreshold(stock, 20);
    expect(res).toEqual([
      { produit_id: "P1", manque_cartons: 15, qte_actuelle: 5 },
      { produit_id: "P3", manque_cartons: 5, qte_actuelle: 15 }
    ]);
  });

  it("retourne une liste vide si tout est au-dessus du seuil", () => {
    const stock = makeStock({ P1: 50, P2: 50 });
    expect(productsBelowThreshold(stock, 20)).toEqual([]);
  });
});

describe("buildCreateOrderBody", () => {
  const now = new Date("2026-04-23T00:00:00Z");

  it("retourne null si aucun produit sous le seuil", () => {
    const stock = makeStock({ P1: 150 });
    const body = buildCreateOrderBody({
      stock,
      identity,
      destination,
      policy,
      now,
      rng: makeRng(1)
    });
    expect(body).toBeNull();
  });

  it("émet au moins une ligne quand au moins un produit est sous le seuil", () => {
    const stock = makeStock({ P1: 10 });
    const body = buildCreateOrderBody({
      stock,
      identity,
      destination,
      policy,
      now,
      rng: makeRng(1)
    });
    expect(body).not.toBeNull();
    expect(body!.order_lines.length).toBeGreaterThan(0);
    expect(body!.order_lines[0].product_id).toBe("P1");
    expect(body!.order_lines[0].quantity_pallets).toBeGreaterThan(0);
  });

  it("respecte le contrat attendu par le backend (champs requis)", () => {
    const stock = makeStock({ P1: 5 });
    const body = buildCreateOrderBody({
      stock,
      identity,
      destination,
      policy,
      now,
      rng: makeRng(7)
    });
    expect(body).not.toBeNull();
    expect(body!.customer.company_name).toBe("Marchand A");
    expect(body!.delivery_destination.delivery_address).toBe("25 avenue Livraison, Lyon");
    expect(policy.time_windows_pool).toContain(body!.delivery_need.delivery_time_window);
    expect(policy.urgency_levels_pool).toContain(body!.delivery_need.urgency_level);
    expect(typeof body!.delivery_need.available_storage_capacity_pallets).toBe("number");
  });

  it("produit des résultats déterministes pour une même seed", () => {
    const stock = makeStock({ P1: 5, P2: 10, P3: 15, P4: 8 });
    const run = (seed: number) =>
      buildCreateOrderBody({
        stock: makeStock({ P1: 5, P2: 10, P3: 15, P4: 8 }),
        identity,
        destination,
        policy,
        now,
        rng: makeRng(seed)
      });
    expect(JSON.stringify(run(123))).toEqual(JSON.stringify(run(123)));
    expect(run(123)).not.toEqual(null);
    expect(stock.allees[0].rangees[0].cartons.length).toBe(4);
  });

  it("produit des résultats différents pour des seeds différentes", () => {
    const stock = makeStock({ P1: 5, P2: 10, P3: 15, P4: 8 });
    const bodies = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((seed) =>
      buildCreateOrderBody({
        stock,
        identity,
        destination,
        policy,
        now,
        rng: makeRng(seed)
      })
    );
    const stringified = new Set(bodies.map((b) => JSON.stringify(b)));
    // Au moins 2 résultats différents parmi 10 tirages
    expect(stringified.size).toBeGreaterThan(1);
  });

  it("n'inclut jamais plus de max_produits_par_commande lignes", () => {
    const stock = makeStock({ P1: 1, P2: 2, P3: 3, P4: 4, P5: 5 });
    for (let seed = 1; seed <= 20; seed++) {
      const body = buildCreateOrderBody({
        stock,
        identity,
        destination,
        policy,
        now,
        rng: makeRng(seed)
      });
      expect(body!.order_lines.length).toBeGreaterThanOrEqual(policy.min_produits_par_commande);
      expect(body!.order_lines.length).toBeLessThanOrEqual(policy.max_produits_par_commande);
    }
  });

  it("les quantités en palettes restent bornées par le facteur_quantite_max", () => {
    const stock = makeStock({ P1: 0 });
    for (let seed = 1; seed <= 10; seed++) {
      const body = buildCreateOrderBody({
        stock,
        identity,
        destination,
        policy,
        now,
        rng: makeRng(seed)
      });
      const maxCartons = Math.floor(policy.quantite_cible_cartons * policy.facteur_quantite_max);
      const maxPalettes = Math.ceil(maxCartons / stock.cartons_par_palette);
      expect(body!.order_lines[0].quantity_pallets).toBeLessThanOrEqual(maxPalettes);
      expect(body!.order_lines[0].quantity_pallets).toBeGreaterThan(0);
    }
  });

  it("horizon de livraison dans la fenêtre min/max", () => {
    const stock = makeStock({ P1: 5 });
    for (let seed = 1; seed <= 20; seed++) {
      const body = buildCreateOrderBody({
        stock,
        identity,
        destination,
        policy,
        now,
        rng: makeRng(seed)
      });
      const date = new Date(body!.delivery_need.requested_delivery_date + "T00:00:00Z");
      const diffJours = Math.round((date.getTime() - now.getTime()) / (24 * 3600 * 1000));
      expect(diffJours).toBeGreaterThanOrEqual(policy.horizon_livraison_jours_min);
      expect(diffJours).toBeLessThanOrEqual(policy.horizon_livraison_jours_max);
    }
  });
});
