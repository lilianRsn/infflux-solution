/// <reference types="jest" />

import {
  buildCreateOrderBody,
  productsBelowThreshold,
  OrderPolicy,
  MerchantIdentity,
  DeliveryDestination
} from "../merchant/behaviors/submit-order";
import { StockMarchand } from "../merchant/storage/model";

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
  horizon_livraison_jours: 5,
  time_window: "morning",
  urgency_level: "flexible",
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
      { produit_id: "P1", manque_cartons: 15 },
      { produit_id: "P3", manque_cartons: 5 }
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
    const body = buildCreateOrderBody({ stock, identity, destination, policy, now });
    expect(body).toBeNull();
  });

  it("convertit les cartons manquants en palettes (arrondi sup)", () => {
    const stock = makeStock({ P1: 10 });
    const body = buildCreateOrderBody({ stock, identity, destination, policy, now });
    expect(body).not.toBeNull();
    // Cible 100, stock 10 → commande 90 cartons → ceil(90/32) = 3 palettes
    expect(body!.order_lines).toEqual([{ product_id: "P1", quantity_pallets: 3 }]);
  });

  it("respecte le contrat attendu par le backend (champs requis)", () => {
    const stock = makeStock({ P1: 5 });
    const body = buildCreateOrderBody({ stock, identity, destination, policy, now });
    expect(body).not.toBeNull();
    expect(body!.customer.company_name).toBe("Marchand A");
    expect(body!.delivery_destination.delivery_address).toBe("25 avenue Livraison, Lyon");
    expect(body!.delivery_need.requested_delivery_date).toBe("2026-04-28");
    expect(body!.delivery_need.delivery_time_window).toBe("morning");
    expect(body!.delivery_need.urgency_level).toBe("flexible");
    expect(typeof body!.delivery_need.available_storage_capacity_pallets).toBe("number");
  });

  it("reporte la capacité de stockage libre en palettes dans le payload", () => {
    // Rangée 200 cartons, 5 occupés → 195 libres, ceil(195/32) = 7
    const stock = makeStock({ P1: 5 });
    const body = buildCreateOrderBody({ stock, identity, destination, policy, now });
    expect(body!.delivery_need.available_storage_capacity_pallets).toBe(7);
  });

  it("commande plusieurs produits quand plusieurs sont sous le seuil", () => {
    const stock = makeStock({ P1: 5, P2: 10, P3: 200 });
    const body = buildCreateOrderBody({ stock, identity, destination, policy, now });
    expect(body!.order_lines.map((l) => l.product_id).sort()).toEqual(["P1", "P2"]);
  });
});
