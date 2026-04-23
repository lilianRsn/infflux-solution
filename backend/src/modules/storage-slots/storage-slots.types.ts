export interface CreateStorageSlotBody {
  aisle_id: string; rank: string; side: string; total_volume: number; used_volume?: number;
  total_pallets?: number; used_pallets?: number; status?: "FREE" | "PARTIAL" | "FULL";
}
export interface PatchStorageSlotBody {
  total_volume?: number; used_volume?: number; total_pallets?: number; used_pallets?: number;
  status?: "FREE" | "PARTIAL" | "FULL";
}
