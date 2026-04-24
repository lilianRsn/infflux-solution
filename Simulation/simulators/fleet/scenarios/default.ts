export interface FleetScenario {
  nom: string;
  seed: number;
  nb_ticks: number;
  tick_rate_ms: number;
  credentials: {
    email: string;
    password: string;
  };
  identity: {
    company_name: string;
    billing_address?: string;
    main_contact_name?: string;
    main_contact_phone?: string;
    main_contact_email?: string;
  };
  fleet: {
    nb_trucks_min: number;
    nb_trucks_max: number;
    name_prefix: string;
    plate_prefix: string;
    max_palettes_min: number;
    max_palettes_max: number;
    max_weight_kg: number;
    max_volume_m3: number;
  };
  /**
   * Nombre de millisecondes réelles qui représentent 1 jour simulé.
   * Règle métier : un plan livré à J+N passe à COMPLETED N * minute_par_jour_ms ms
   * après son passage en IN_PROGRESS.
   */
  minute_par_jour_ms: number;
}

export const defaultScenario: FleetScenario = {
  nom: "fleet-default",
  seed: Math.floor(Math.random() * 1000000),
  nb_ticks: Infinity,
  tick_rate_ms: 60000,
  credentials: {
    email: process.env.FLEET_EMAIL ?? "admin-fleet@example.com",
    password: process.env.FLEET_PASSWORD ?? "Pass1234!"
  },
  identity: {
    company_name: process.env.FLEET_COMPANY_NAME ?? "Infflux Fleet",
    billing_address: "1 rue Logistique, Paris",
    main_contact_name: "Admin Flotte",
    main_contact_phone: "0600000000",
    main_contact_email: process.env.FLEET_EMAIL ?? "admin-fleet@example.com"
  },
  fleet: {
    nb_trucks_min: Number(process.env.FLEET_TRUCKS_MIN ?? 3),
    nb_trucks_max: Number(process.env.FLEET_TRUCKS_MAX ?? 8),
    name_prefix: process.env.FLEET_TRUCK_PREFIX ?? "INFFLUX",
    plate_prefix: process.env.FLEET_PLATE_PREFIX ?? "IX",
    max_palettes_min: 18,
    max_palettes_max: 33,
    max_weight_kg: 20000,
    max_volume_m3: 40
  },
  minute_par_jour_ms: Number(process.env.FLEET_MINUTE_PAR_JOUR_MS ?? 60000)
};
