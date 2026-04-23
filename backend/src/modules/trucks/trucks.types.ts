export interface CreateTruckBody {
  code: string;
  max_pallets: number;
  max_volume_m3?: number;
  max_weight_kg?: number;
  status?: "AVAILABLE" | "IN_DELIVERY" | "MAINTENANCE";
}

export interface UpdateTruckBody {
  code?: string;
  max_pallets?: number;
  max_volume_m3?: number;
  max_weight_kg?: number;
  status?: "AVAILABLE" | "IN_DELIVERY" | "MAINTENANCE";
}
