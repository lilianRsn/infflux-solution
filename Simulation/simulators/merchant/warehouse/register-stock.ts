import { ApiClient } from "../../shared/api-client";
import {
  createWarehouse,
  createFloor,
  createAisle,
  createStorageSlot
} from "../../shared/warehouses-api";
import { StockMarchand } from "../storage/model";
import { computeSlotPayload, occupationCartons } from "./slot-payload";

export interface WarehouseRegistrationParams {
  warehouse_name: string;
  warehouse_address: string;
  floor_label: string;
  floor_level: number;
  slot_side: string;
  m3_par_carton: number;
}

export interface StockRegistration {
  warehouse_id: string;
  floor_id: string;
  aisle_ids: Record<string, string>;
  slot_ids: Record<string, string>;
}

export async function registerStock(
  client: ApiClient,
  stock: StockMarchand,
  params: WarehouseRegistrationParams
): Promise<StockRegistration> {
  const warehouse = await createWarehouse(client, {
    name: params.warehouse_name,
    address: params.warehouse_address,
    floors_count: 1
  });

  const floor = await createFloor(client, warehouse.id, {
    level: params.floor_level,
    label: params.floor_label
  });

  const aisle_ids: Record<string, string> = {};
  const slot_ids: Record<string, string> = {};

  for (const allee of stock.allees) {
    const aisle = await createAisle(client, floor.id, { code: allee.allee_id });
    aisle_ids[allee.allee_id] = aisle.id;

    for (const rangee of allee.rangees) {
      const payload = computeSlotPayload({
        capacite_cartons: rangee.capacite_cartons,
        cartons_occupes: occupationCartons(rangee),
        cartons_par_palette: stock.cartons_par_palette,
        m3_par_carton: params.m3_par_carton
      });

      const slot = await createStorageSlot(client, {
        aisle_id: aisle.id,
        rank: rangee.rangee_id,
        side: params.slot_side,
        ...payload
      });
      slot_ids[rangee.rangee_id] = slot.id;
    }
  }

  return {
    warehouse_id: warehouse.id,
    floor_id: floor.id,
    aisle_ids,
    slot_ids
  };
}
