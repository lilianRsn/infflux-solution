import { BuildStockParams } from "../storage/build";
import { OrderPolicy, MerchantIdentity, DeliveryDestination } from "../behaviors/submit-order";
import { WarehouseRegistrationParams } from "../warehouse/register-stock";

export interface MerchantScenario {
  nom: string;
  seed: number;
  nb_ticks: number;
  tick_rate_ms: number;
  proba_consommation_par_tick: number;
  cartons_consommes_par_tick_min: number;
  cartons_consommes_par_tick_max: number;
  credentials: {
    email: string;
    password: string;
  };
  identity: MerchantIdentity;
  destination: DeliveryDestination;
  stock_init: BuildStockParams;
  warehouse: WarehouseRegistrationParams;
  order_policy: OrderPolicy;
}

export const defaultScenario: MerchantScenario = {
  nom: "default",
  seed: 42,
  nb_ticks: 15,
  tick_rate_ms: 1500,
  proba_consommation_par_tick: 0.7,
  cartons_consommes_par_tick_min: 1,
  cartons_consommes_par_tick_max: 6,
  credentials: {
    email: process.env.MERCHANT_EMAIL ?? "marchand-a@example.com",
    password: process.env.MERCHANT_PASSWORD ?? "Pass1234!"
  },
  identity: {
    company_name: process.env.MERCHANT_COMPANY_NAME ?? "Marchand A",
    billing_address: process.env.MERCHANT_BILLING_ADDRESS ?? "12 rue Exemple, Paris",
    main_contact_name: process.env.MERCHANT_CONTACT_NAME ?? "Jean Dupont",
    main_contact_phone: process.env.MERCHANT_CONTACT_PHONE ?? "0600000000",
    main_contact_email: process.env.MERCHANT_EMAIL ?? "marchand-a@example.com"
  },
  destination: {
    delivery_address: "25 avenue Livraison, Lyon",
    site_name: "Magasin Lyon",
    delivery_contact_name: "Sophie Martin",
    delivery_contact_phone: "0611111111"
  },
  stock_init: {
    marchand_id: "marchand-a",
    nb_allees: 3,
    nb_rangees_par_allee: 4,
    capacite_cartons_par_rangee: 50,
    cartons_par_palette: 32,
    catalogue: ["PROD_001", "PROD_002", "PROD_003", "PROD_004"],
    taux_remplissage_initial: 0.6
  },
  warehouse: {
    warehouse_name: "Entrepot Marchand A",
    warehouse_address: "12 rue Exemple, Paris",
    floor_label: "RDC",
    floor_level: 1,
    slot_side: "LEFT",
    m3_par_carton: 0.05
  },
  order_policy: {
    seuil_commande_cartons: 20,
    quantite_cible_cartons: 100,
    facteur_quantite_max: 1.5,
    min_produits_par_commande: 1,
    max_produits_par_commande: 3,
    horizon_livraison_jours_min: 3,
    horizon_livraison_jours_max: 8,
    time_windows_pool: ["morning", "afternoon", "full_day"],
    urgency_levels_pool: ["flexible", "standard"],
    grouped_delivery_allowed: true,
    partner_delivery_allowed: true,
    can_receive_early: true,
    can_store_early_delivery: true
  }
};
