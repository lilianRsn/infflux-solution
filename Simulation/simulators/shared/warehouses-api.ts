import { ApiClient } from "./api-client";

export interface WarehouseCreated {
  id: string;
  client_id: string;
  name: string;
  address: string;
  floors_count: number;
}

export interface FloorCreated {
  id: string;
  client_warehouse_id: string;
  level: number;
  label: string;
}

export interface AisleCreated {
  id: string;
  floor_id: string;
  code: string;
  position_x: number | null;
  position_y: number | null;
}

export type SlotStatus = "FREE" | "PARTIAL" | "FULL";
export type DockSide = "N" | "S" | "E" | "W";

export interface StorageSlotCreated {
  id: string;
  aisle_id: string;
  rank: string;
  side: string;
  total_volume: number;
  used_volume: number | null;
  total_pallets: number | null;
  used_pallets: number | null;
  status: SlotStatus;
}

export interface CreateSlotPayload {
  aisle_id: string;
  rank: string;
  side: string;
  total_volume: number;
  used_volume?: number;
  total_pallets?: number;
  used_pallets?: number;
  status?: SlotStatus;
}

export interface PatchSlotPayload {
  total_volume?: number;
  used_volume?: number;
  total_pallets?: number;
  used_pallets?: number;
  status?: SlotStatus;
}

export function createWarehouse(
  client: ApiClient,
  body: { name: string; address: string; floors_count?: number }
): Promise<WarehouseCreated> {
  return client.post<WarehouseCreated>("/api/client-warehouses", body);
}

export function createFloor(
  client: ApiClient,
  warehouseId: string,
  body: { level: number; label: string }
): Promise<FloorCreated> {
  return client.post<FloorCreated>(`/api/client-warehouses/${warehouseId}/floors`, body);
}

export function createAisle(
  client: ApiClient,
  floorId: string,
  body: { code: string; position_x?: number; position_y?: number }
): Promise<AisleCreated> {
  return client.post<AisleCreated>(
    `/api/client-warehouses/floors/${floorId}/aisles`,
    body
  );
}

export function createStorageSlot(
  client: ApiClient,
  payload: CreateSlotPayload
): Promise<StorageSlotCreated> {
  return client.post<StorageSlotCreated>("/api/storage-slots", payload);
}

export function patchStorageSlot(
  client: ApiClient,
  slotId: string,
  payload: PatchSlotPayload
): Promise<StorageSlotCreated> {
  return client.patch<StorageSlotCreated>(`/api/storage-slots/${slotId}`, payload);
}
