import { StockMarchand } from "../storage/model";
import { capaciteLibreCartons, totalCartonsParProduit } from "../storage/convert";

export interface StockSnapshot {
  marchand_id: string;
  cartons_par_palette: number;
  capacite_libre_cartons: number;
  totaux_cartons_par_produit: Record<string, number>;
  detail_allees: Array<{
    allee_id: string;
    rangees: Array<{
      rangee_id: string;
      capacite_cartons: number;
      occupation_cartons: number;
      produits: Array<{ produit_id: string; quantite_cartons: number }>;
    }>;
  }>;
}

export function snapshotStock(stock: StockMarchand): StockSnapshot {
  return {
    marchand_id: stock.marchand_id,
    cartons_par_palette: stock.cartons_par_palette,
    capacite_libre_cartons: capaciteLibreCartons(stock),
    totaux_cartons_par_produit: totalCartonsParProduit(stock),
    detail_allees: stock.allees.map((allee) => ({
      allee_id: allee.allee_id,
      rangees: allee.rangees.map((rangee) => ({
        rangee_id: rangee.rangee_id,
        capacite_cartons: rangee.capacite_cartons,
        occupation_cartons: rangee.cartons.reduce((s, c) => s + c.quantite_cartons, 0),
        produits: rangee.cartons.map((c) => ({
          produit_id: c.produit_id,
          quantite_cartons: c.quantite_cartons
        }))
      }))
    }))
  };
}
