/// <reference types="jest" />

import {
  cartonsToPalettes,
  totalCartonsParProduit,
  capaciteLibreCartons
} from "../merchant/storage/convert";
import { StockMarchand } from "../merchant/storage/model";

describe("cartonsToPalettes", () => {
  it("arrondit au supérieur (32 cartons par palette)", () => {
    expect(cartonsToPalettes(0, 32)).toBe(0);
    expect(cartonsToPalettes(1, 32)).toBe(1);
    expect(cartonsToPalettes(32, 32)).toBe(1);
    expect(cartonsToPalettes(33, 32)).toBe(2);
    expect(cartonsToPalettes(100, 32)).toBe(4);
  });

  it("lève si cartonsParPalette <= 0", () => {
    expect(() => cartonsToPalettes(10, 0)).toThrow(RangeError);
    expect(() => cartonsToPalettes(10, -1)).toThrow(RangeError);
  });

  it("lève si cartons négatifs", () => {
    expect(() => cartonsToPalettes(-1, 32)).toThrow(RangeError);
  });
});

const stockVide: StockMarchand = {
  marchand_id: "m",
  cartons_par_palette: 32,
  allees: []
};

const stockRempli: StockMarchand = {
  marchand_id: "m",
  cartons_par_palette: 32,
  allees: [
    {
      allee_id: "A1",
      rangees: [
        {
          rangee_id: "A1-R1",
          capacite_cartons: 50,
          cartons: [
            { produit_id: "P1", quantite_cartons: 20 },
            { produit_id: "P2", quantite_cartons: 10 }
          ]
        },
        {
          rangee_id: "A1-R2",
          capacite_cartons: 50,
          cartons: [{ produit_id: "P1", quantite_cartons: 5 }]
        }
      ]
    }
  ]
};

describe("totalCartonsParProduit", () => {
  it("retourne un objet vide pour un stock vide", () => {
    expect(totalCartonsParProduit(stockVide)).toEqual({});
  });

  it("agrège les quantités par produit sur toutes les rangées", () => {
    expect(totalCartonsParProduit(stockRempli)).toEqual({ P1: 25, P2: 10 });
  });
});

describe("capaciteLibreCartons", () => {
  it("retourne 0 pour un stock vide (aucune capacité)", () => {
    expect(capaciteLibreCartons(stockVide)).toBe(0);
  });

  it("calcule la capacité libre totale", () => {
    // 2 rangées x 50 = 100 capacité, 35 occupés → 65 libres
    expect(capaciteLibreCartons(stockRempli)).toBe(65);
  });
});
