import { StockMarchand } from "./model";

export function cartonsToPalettes(cartons: number, cartonsParPalette: number): number {
  if (cartonsParPalette <= 0) {
    throw new RangeError("cartonsParPalette must be > 0");
  }
  if (cartons < 0) {
    throw new RangeError("cartons must be >= 0");
  }
  return Math.ceil(cartons / cartonsParPalette);
}

export function totalCartonsParProduit(stock: StockMarchand): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const allee of stock.allees) {
    for (const rangee of allee.rangees) {
      for (const carton of rangee.cartons) {
        totals[carton.produit_id] = (totals[carton.produit_id] ?? 0) + carton.quantite_cartons;
      }
    }
  }
  return totals;
}

export function capaciteLibreCartons(stock: StockMarchand): number {
  let capaciteTotale = 0;
  let occupe = 0;
  for (const allee of stock.allees) {
    for (const rangee of allee.rangees) {
      capaciteTotale += rangee.capacite_cartons;
      occupe += rangee.cartons.reduce((sum, c) => sum + c.quantite_cartons, 0);
    }
  }
  return Math.max(0, capaciteTotale - occupe);
}
