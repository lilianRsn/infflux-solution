import { ApiClient } from "./api-client";

export type TruckStatus = "AVAILABLE" | "ON_ROUTE" | "LOADING" | "MAINTENANCE";

export interface Truck {
  id: string;
  name: string;
  license_plate: string;
  max_palettes: number;
  max_weight_kg: number;
  max_volume_m3: number;
  status: TruckStatus;
  current_route: string | null;
  fill_percent: number;
  driver_name: string | null;
  notes: string | null;
}

export interface CreateTruckBody {
  name: string;
  license_plate: string;
  max_palettes?: number;
  max_weight_kg?: number;
  max_volume_m3?: number;
  status?: TruckStatus;
  driver_name?: string;
  notes?: string;
}

export interface UpdateTruckBody {
  status?: TruckStatus;
  current_route?: string | null;
  fill_percent?: number;
  driver_name?: string | null;
  notes?: string | null;
}

export function listTrucks(client: ApiClient): Promise<Truck[]> {
  return client.get<Truck[]>("/api/trucks");
}

export function getTruck(client: ApiClient, truckId: string): Promise<Truck> {
  return client.get<Truck>(`/api/trucks/${truckId}`);
}

export function createTruck(client: ApiClient, body: CreateTruckBody): Promise<Truck> {
  return client.post<Truck>("/api/trucks", body);
}

export function patchTruck(
  client: ApiClient,
  truckId: string,
  body: UpdateTruckBody
): Promise<Truck> {
  return client.patch<Truck>(`/api/trucks/${truckId}`, body);
}
