export interface PatchLoadingDockBody {
  status?: "FREE" | "OCCUPIED" | "MAINTENANCE";
  current_order_id?: string | null;
  max_tonnage?: number;
  max_width_meters?: number;
}
