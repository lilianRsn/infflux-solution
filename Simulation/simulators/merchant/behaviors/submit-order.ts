import { cartonsToPalettes, capaciteLibreCartons, totalCartonsParProduit } from "../storage/convert";
import { StockMarchand } from "../storage/model";
import { Rng } from "../../shared/rng";

export interface MerchantIdentity {
  company_name: string;
  billing_address: string;
  main_contact_name: string;
  main_contact_phone: string;
  main_contact_email: string;
}

export interface DeliveryDestination {
  delivery_address: string;
  site_name?: string;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
}

export type TimeWindow = "morning" | "afternoon" | "full_day";
export type UrgencyLevel = "urgent" | "standard" | "flexible";

export interface OrderPolicy {
  seuil_commande_cartons: number;
  quantite_cible_cartons: number;
  facteur_quantite_max: number;
  min_produits_par_commande: number;
  max_produits_par_commande: number;
  horizon_livraison_jours_min: number;
  horizon_livraison_jours_max: number;
  time_windows_pool: readonly TimeWindow[];
  urgency_levels_pool: readonly UrgencyLevel[];
  grouped_delivery_allowed: boolean;
  partner_delivery_allowed: boolean;
  can_receive_early: boolean;
  can_store_early_delivery: boolean;
}

export interface BuildOrderInput {
  stock: StockMarchand;
  identity: MerchantIdentity;
  destination: DeliveryDestination;
  policy: OrderPolicy;
  now: Date;
  rng: Rng;
  client_warehouse_id: string;
}

export interface OrderLinePayload {
  product_id: string;
  quantity_pallets: number;
}

export interface CreateOrderBody {
  client_warehouse_id: string;
  customer: {
    company_name: string;
    billing_address: string;
    main_contact_name: string;
    main_contact_phone: string;
    main_contact_email: string;
  };
  delivery_destination: DeliveryDestination;
  order_lines: OrderLinePayload[];
  delivery_need: {
    requested_delivery_date: string;
    delivery_time_window: TimeWindow;
    urgency_level: UrgencyLevel;
    can_receive_early: boolean;
    can_store_early_delivery: boolean;
    available_storage_capacity_pallets: number;
    grouped_delivery_allowed: boolean;
    partner_delivery_allowed: boolean;
  };
}

export function productsBelowThreshold(
  stock: StockMarchand,
  seuilCartons: number
): Array<{ produit_id: string; manque_cartons: number; qte_actuelle: number }> {
  const totaux = totalCartonsParProduit(stock);
  const manquants: Array<{ produit_id: string; manque_cartons: number; qte_actuelle: number }> = [];
  for (const [produit_id, qte] of Object.entries(totaux)) {
    if (qte < seuilCartons) {
      manquants.push({ produit_id, manque_cartons: seuilCartons - qte, qte_actuelle: qte });
    }
  }
  return manquants.sort((a, b) => b.manque_cartons - a.manque_cartons);
}

export function buildCreateOrderBody(input: BuildOrderInput): CreateOrderBody | null {
  const manquants = productsBelowThreshold(input.stock, input.policy.seuil_commande_cartons);
  if (manquants.length === 0) return null;

  const choisis = pickRandomProducts(
    input.rng,
    manquants,
    input.policy.min_produits_par_commande,
    input.policy.max_produits_par_commande
  );

  const lignes: OrderLinePayload[] = [];
  for (const { produit_id, manque_cartons } of choisis) {
    const minCartons = Math.max(1, manque_cartons);
    const maxCartons = Math.max(
      minCartons,
      Math.floor(input.policy.quantite_cible_cartons * input.policy.facteur_quantite_max)
    );
    const cartonsACommander = input.rng.intBetween(minCartons, maxCartons);
    const palettes = cartonsToPalettes(cartonsACommander, input.stock.cartons_par_palette);
    if (palettes > 0) {
      lignes.push({ product_id: produit_id, quantity_pallets: palettes });
    }
  }

  if (lignes.length === 0) return null;

  const horizon = input.rng.intBetween(
    input.policy.horizon_livraison_jours_min,
    input.policy.horizon_livraison_jours_max
  );
  const livraison = addDays(input.now, horizon);
  const capacitePalettes = cartonsToPalettes(
    capaciteLibreCartons(input.stock),
    input.stock.cartons_par_palette
  );
  const timeWindow = input.rng.pick(input.policy.time_windows_pool);
  const urgency = input.rng.pick(input.policy.urgency_levels_pool);

  return {
    client_warehouse_id: input.client_warehouse_id,
    customer: {
      company_name: input.identity.company_name,
      billing_address: input.identity.billing_address,
      main_contact_name: input.identity.main_contact_name,
      main_contact_phone: input.identity.main_contact_phone,
      main_contact_email: input.identity.main_contact_email
    },
    delivery_destination: input.destination,
    order_lines: lignes,
    delivery_need: {
      requested_delivery_date: toIsoDate(livraison),
      delivery_time_window: timeWindow,
      urgency_level: urgency,
      can_receive_early: input.policy.can_receive_early,
      can_store_early_delivery: input.policy.can_store_early_delivery,
      available_storage_capacity_pallets: capacitePalettes,
      grouped_delivery_allowed: input.policy.grouped_delivery_allowed,
      partner_delivery_allowed: input.policy.partner_delivery_allowed
    }
  };
}

function pickRandomProducts<T>(
  rng: Rng,
  candidats: readonly T[],
  min_produits: number,
  max_produits: number
): T[] {
  if (candidats.length === 0) return [];
  const maxPossible = Math.min(candidats.length, Math.max(1, max_produits));
  const minPossible = Math.max(1, Math.min(min_produits, maxPossible));
  const nb = rng.intBetween(minPossible, maxPossible);

  const pool = [...candidats];
  const choisis: T[] = [];
  for (let i = 0; i < nb; i++) {
    const idx = rng.intBetween(0, pool.length - 1);
    choisis.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return choisis;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
