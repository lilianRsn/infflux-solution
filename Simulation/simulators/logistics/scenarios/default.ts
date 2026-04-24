export interface LogisticsScenario {
  nom: string;
  seed: number;
  nb_ticks: number;
  tick_rate_ms: number; // Intervalle pour appeler generate (ex: 60000 pour 1 min)
  
  credentials: {
    email: string;
    password: string;
  };

  warehouse: {
    name: string;
    address: string;
    docks_count: number;
  };

  trucks: {
    min_count: number;
    max_count: number;
    pallet_capacity_min: number;
    pallet_capacity_max: number;
  };

  simulated_day_duration_ms: number; // Temps réel correspondant à 1 jour de livraison
}

export const defaultLogisticsScenario: LogisticsScenario = {
  nom: "standard-logistics",
  seed: 1234,
  nb_ticks: Infinity,
  tick_rate_ms: 60000, // Toutes les minutes
  
  credentials: {
    email: process.env.ADMIN_EMAIL ?? "admin@example.com",
    password: process.env.ADMIN_PASSWORD ?? "Admin123!"
  },

  warehouse: {
    name: "Hub Logistique Central",
    address: "100 Avenue de la Logistique, 69000 Lyon",
    docks_count: 5
  },

  trucks: {
    min_count: 5,
    max_count: 15,
    pallet_capacity_min: 10,
    pallet_capacity_max: 33
  },

  simulated_day_duration_ms: 60000 // 1 minute = 1 jour
};
