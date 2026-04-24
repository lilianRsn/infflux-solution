export type TruckStatus = "AVAILABLE" | "ON_ROUTE" | "LOADING" | "MAINTENANCE";

export interface CreateTruckBody {
  name: string;
  license_plate: string;
  max_palettes?: number;
  max_weight_kg?: number;
  max_volume_m3?: number;
  status?: TruckStatus;
  current_route?: string;
  fill_percent?: number;
  driver_name?: string;
  notes?: string;
}

export interface UpdateTruckBody {
  name?: string;
  license_plate?: string;
  max_palettes?: number;
  max_weight_kg?: number;
  max_volume_m3?: number;
  status?: TruckStatus;
  current_route?: string | null;
  fill_percent?: number;
  driver_name?: string | null;
  notes?: string | null;
}