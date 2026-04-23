/// <reference types="jest" />

import { consommerCartons } from "../merchant/storage/build";
import { StockMarchand } from "../merchant/storage/model";

function makeStock(): StockMarchand {
  return {
    marchand_id: "m",
    cartons_par_palette: 32,
    allees: [
      {
        allee_id: "A1",
        rangees: [
          {
            rangee_id: "A1-R1",
            capacite_cartons: 50,
            cartons: [{ produit_id: "P1", quantite_cartons: 20 }]
          },
          {
            rangee_id: "A1-R2",
            capacite_cartons: 50,
            cartons: [{ produit_id: "P1", quantite_cartons: 15 }]
          }
        ]
      }
    ]
  };
}

describe("consommerCartons", () => {
  it("consomme la quantité demandée et retourne la rangée modifiée", () => {
    const stock = makeStock();
    const res = consommerCartons(stock, "P1", 10);
    expect(res.cartons_consommes).toBe(10);
    expect(res.rangees_modifiees).toEqual(["A1-R1"]);
    expect(stock.allees[0].rangees[0].cartons[0].quantite_cartons).toBe(10);
    expect(stock.allees[0].rangees[1].cartons[0].quantite_cartons).toBe(15);
  });

  it("consomme sur plusieurs rangées si la première ne suffit pas", () => {
    const stock = makeStock();
    const res = consommerCartons(stock, "P1", 25);
    expect(res.cartons_consommes).toBe(25);
    expect(res.rangees_modifiees.sort()).toEqual(["A1-R1", "A1-R2"]);
    expect(stock.allees[0].rangees[0].cartons.length).toBe(0);
    expect(stock.allees[0].rangees[1].cartons[0].quantite_cartons).toBe(10);
  });

  it("limite la consommation au stock disponible", () => {
    const stock = makeStock();
    const res = consommerCartons(stock, "P1", 1000);
    expect(res.cartons_consommes).toBe(35);
    expect(res.rangees_modifiees.sort()).toEqual(["A1-R1", "A1-R2"]);
  });

  it("ignore les rangées qui ne contiennent pas le produit", () => {
    const stock = makeStock();
    const res = consommerCartons(stock, "P_UNKNOWN", 10);
    expect(res.cartons_consommes).toBe(0);
    expect(res.rangees_modifiees).toEqual([]);
  });
});
