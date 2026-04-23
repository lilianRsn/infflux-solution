import { Rng } from "../../shared/rng";
import { Allee, Carton, Rangee, StockMarchand } from "./model";

export interface BuildStockParams {
  marchand_id: string;
  nb_allees: number;
  nb_rangees_par_allee: number;
  capacite_cartons_par_rangee: number;
  cartons_par_palette: number;
  catalogue: readonly string[];
  taux_remplissage_initial: number;
}

export function buildStock(rng: Rng, params: BuildStockParams): StockMarchand {
  const allees: Allee[] = [];

  for (let a = 1; a <= params.nb_allees; a++) {
    const rangees: Rangee[] = [];
    for (let r = 1; r <= params.nb_rangees_par_allee; r++) {
      const produit = rng.pick(params.catalogue);
      const cible = Math.floor(params.capacite_cartons_par_rangee * params.taux_remplissage_initial);
      const qte = rng.intBetween(Math.max(0, cible - 5), cible);
      const cartons: Carton[] = qte > 0 ? [{ produit_id: produit, quantite_cartons: qte }] : [];
      rangees.push({
        rangee_id: `A${a}-R${r}`,
        capacite_cartons: params.capacite_cartons_par_rangee,
        cartons
      });
    }
    allees.push({ allee_id: `A${a}`, rangees });
  }

  return {
    marchand_id: params.marchand_id,
    cartons_par_palette: params.cartons_par_palette,
    allees
  };
}

export interface ConsommationResult {
  cartons_consommes: number;
  rangees_modifiees: string[];
}

export function consommerCartons(
  stock: StockMarchand,
  produit_id: string,
  cartonsAConsommer: number
): ConsommationResult {
  let restant = cartonsAConsommer;
  const rangeesModifiees = new Set<string>();

  for (const allee of stock.allees) {
    for (const rangee of allee.rangees) {
      let modifieeIci = false;
      for (const carton of rangee.cartons) {
        if (restant <= 0) break;
        if (carton.produit_id !== produit_id) continue;
        const pris = Math.min(carton.quantite_cartons, restant);
        if (pris > 0) {
          carton.quantite_cartons -= pris;
          restant -= pris;
          modifieeIci = true;
        }
      }
      if (modifieeIci) {
        rangee.cartons = rangee.cartons.filter((c) => c.quantite_cartons > 0);
        rangeesModifiees.add(rangee.rangee_id);
      }
    }
  }

  return {
    cartons_consommes: cartonsAConsommer - restant,
    rangees_modifiees: [...rangeesModifiees]
  };
}
