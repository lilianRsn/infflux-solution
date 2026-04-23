import { ApiClient } from "../../shared/api-client";
import { patchStorageSlot } from "../../shared/warehouses-api";
import { Rangee, StockMarchand } from "../storage/model";
import { computeSlotPayload, occupationCartons } from "./slot-payload";

export interface SyncSlotParams {
  stock: StockMarchand;
  rangee: Rangee;
  slotId: string;
  m3_par_carton: number;
}

export async function syncSlot(client: ApiClient, params: SyncSlotParams): Promise<void> {
  const payload = computeSlotPayload({
    capacite_cartons: params.rangee.capacite_cartons,
    cartons_occupes: occupationCartons(params.rangee),
    cartons_par_palette: params.stock.cartons_par_palette,
    m3_par_carton: params.m3_par_carton
  });
  await patchStorageSlot(client, params.slotId, payload);
}
