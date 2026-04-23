import { cartonsToPalettes, capaciteLibreCartons, totalCartonsParProduit } from "../storage/convert";
import { StockMarchand } from "../storage/model";

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

export interface OrderPolicy {
  seuil_commande_cartons: number;
  quantite_cible_cartons: number;
  horizon_livraison_jours: number;
  time_window: "morning" | "afternoon" | "full_day";
  urgency_level: "urgent" | "standard" | "flexible";
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
}

export interface OrderLinePayload {
  product_id: string;
  quantity_pallets: number;
}

export interface CreateOrderBody {
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
    delivery_time_window: "morning" | "afternoon" | "full_day";
    urgency_level: "urgent" | "standard" | "flexible";
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
): Array<{ produit_id: string; manque_cartons: number }> {
  const totaux = totalCartonsParProduit(stock);
  const manquants: Array<{ produit_id: string; manque_cartons: number }> = [];
  for (const [produit_id, qte] of Object.entries(totaux)) {
    if (qte < seuilCartons) {
      manquants.push({ produit_id, manque_cartons: seuilCartons - qte });
    }
  }
  return manquants.sort((a, b) => b.manque_cartons - a.manque_cartons);
}

export function buildCreateOrderBody(input: BuildOrderInput): CreateOrderBody | null {
  const totaux = totalCartonsParProduit(input.stock);
  const lignes: OrderLinePayload[] = [];

  for (const [produit_id, qteActuelle] of Object.entries(totaux)) {
    if (qteActuelle >= input.policy.seuil_commande_cartons) continue;
    const cartonsACommander = Math.max(
      0,
      input.policy.quantite_cible_cartons - qteActuelle
    );
    if (cartonsACommander <= 0) continue;
    const palettes = cartonsToPalettes(cartonsACommander, input.stock.cartons_par_palette);
    if (palettes > 0) {
      lignes.push({ product_id: produit_id, quantity_pallets: palettes });
    }
  }

  if (lignes.length === 0) return null;

  const livraison = addDays(input.now, input.policy.horizon_livraison_jours);
  const capaciteLibre = capaciteLibreCartons(input.stock);
  const capacitePalettes = cartonsToPalettes(capaciteLibre, input.stock.cartons_par_palette);

  return {
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
      delivery_time_window: input.policy.time_window,
      urgency_level: input.policy.urgency_level,
      can_receive_early: input.policy.can_receive_early,
      can_store_early_delivery: input.policy.can_store_early_delivery,
      available_storage_capacity_pallets: capacitePalettes,
      grouped_delivery_allowed: input.policy.grouped_delivery_allowed,
      partner_delivery_allowed: input.policy.partner_delivery_allowed
    }
  };
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
