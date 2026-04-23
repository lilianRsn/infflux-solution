export interface Carton {
  produit_id: string;
  quantite_cartons: number;
}

export interface Rangee {
  rangee_id: string;
  capacite_cartons: number;
  cartons: Carton[];
}

export interface Allee {
  allee_id: string;
  rangees: Rangee[];
}

export interface StockMarchand {
  marchand_id: string;
  cartons_par_palette: number;
  allees: Allee[];
}
