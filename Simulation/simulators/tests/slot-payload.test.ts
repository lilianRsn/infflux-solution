/// <reference types="jest" />

import {
  computeSlotPayload,
  deriveStatus,
  occupationCartons
} from "../merchant/warehouse/slot-payload";
import { Rangee } from "../merchant/storage/model";

describe("deriveStatus", () => {
  it("retourne FREE quand vide", () => {
    expect(deriveStatus(0, 50)).toBe("FREE");
    expect(deriveStatus(0, 0)).toBe("FREE");
  });

  it("retourne PARTIAL quand partiellement rempli", () => {
    expect(deriveStatus(1, 50)).toBe("PARTIAL");
    expect(deriveStatus(49, 50)).toBe("PARTIAL");
  });

  it("retourne FULL quand plein ou au-dessus", () => {
    expect(deriveStatus(50, 50)).toBe("FULL");
    expect(deriveStatus(60, 50)).toBe("FULL");
  });
});

describe("occupationCartons", () => {
  it("somme les cartons d'une rangée multi-produits", () => {
    const rangee: Rangee = {
      rangee_id: "A1-R1",
      capacite_cartons: 100,
      cartons: [
        { produit_id: "P1", quantite_cartons: 20 },
        { produit_id: "P2", quantite_cartons: 15 }
      ]
    };
    expect(occupationCartons(rangee)).toBe(35);
  });

  it("retourne 0 pour une rangée vide", () => {
    expect(
      occupationCartons({ rangee_id: "A1-R1", capacite_cartons: 100, cartons: [] })
    ).toBe(0);
  });
});

describe("computeSlotPayload", () => {
  it("calcule total/used palettes + volumes + status pour un slot partiel", () => {
    const payload = computeSlotPayload({
      capacite_cartons: 50,
      cartons_occupes: 20,
      cartons_par_palette: 32,
      m3_par_carton: 0.05
    });
    // 50 cartons / 32 → 2 palettes ; 20 / 32 → 1 palette
    expect(payload.total_pallets).toBe(2);
    expect(payload.used_pallets).toBe(1);
    expect(payload.total_volume).toBe(2.5);
    expect(payload.used_volume).toBe(1);
    expect(payload.status).toBe("PARTIAL");
  });

  it("retourne status FULL quand cartons_occupes == capacite", () => {
    const payload = computeSlotPayload({
      capacite_cartons: 10,
      cartons_occupes: 10,
      cartons_par_palette: 5,
      m3_par_carton: 0.1
    });
    expect(payload.status).toBe("FULL");
  });

  it("retourne status FREE quand vide", () => {
    const payload = computeSlotPayload({
      capacite_cartons: 10,
      cartons_occupes: 0,
      cartons_par_palette: 5,
      m3_par_carton: 0.1
    });
    expect(payload.status).toBe("FREE");
    expect(payload.used_pallets).toBe(0);
    expect(payload.used_volume).toBe(0);
  });

  it("lève si m3_par_carton <= 0", () => {
    expect(() =>
      computeSlotPayload({
        capacite_cartons: 10,
        cartons_occupes: 5,
        cartons_par_palette: 5,
        m3_par_carton: 0
      })
    ).toThrow(RangeError);
  });

  it("lève si cartons_occupes négatifs ou dépasse capacite", () => {
    expect(() =>
      computeSlotPayload({
        capacite_cartons: 10,
        cartons_occupes: -1,
        cartons_par_palette: 5,
        m3_par_carton: 0.05
      })
    ).toThrow(RangeError);
    expect(() =>
      computeSlotPayload({
        capacite_cartons: 10,
        cartons_occupes: 11,
        cartons_par_palette: 5,
        m3_par_carton: 0.05
      })
    ).toThrow(RangeError);
  });
});
