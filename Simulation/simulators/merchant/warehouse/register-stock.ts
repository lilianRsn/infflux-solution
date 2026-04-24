import { ApiClient } from "../../shared/api-client";
import {
  createWarehouse,
  createFloor,
  createAisle,
  createStorageSlot,
  createLoadingDock,
  CreateLoadingDockBody,
  listWarehouseDockCodes
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
  logistics_hub_id?: string | null;
  docks?: CreateLoadingDockBody[];
}

export const DEFAULT_DOCKS: CreateLoadingDockBody[] = [
  { code: "D1", position_x: 10, position_y: 0, side: "N", max_tonnage: 20, max_width_meters: 3 },
  { code: "D2", position_x: 20, position_y: 0, side: "N", max_tonnage: 20, max_width_meters: 3 },
  { code: "D3", position_x: 30, position_y: 0, side: "N", max_tonnage: 12, max_width_meters: 3 }
];

export async function ensureDocks(
  client: ApiClient,
  warehouseId: string,
  docks: CreateLoadingDockBody[]
): Promise<number> {
  const existingCodes = await listWarehouseDockCodes(client, warehouseId);
  let created = 0;
  for (const spec of docks) {
    if (existingCodes.has(spec.code)) continue;
    await createLoadingDock(client, warehouseId, spec);
    created++;
  }
  return created;
}

export interface StockRegistration {
  warehouse_id: string;
  floor_id: string;
  aisle_ids: Record<string, string>;
  slot_ids: Record<string, string>;
  reused: boolean;
}

export async function registerStock(
  client: ApiClient,
  stock: StockMarchand,
  params: WarehouseRegistrationParams
): Promise<StockRegistration> {
  const warehouse = await createWarehouse(client, {
    name: params.warehouse_name,
    address: params.warehouse_address,
    floors_count: 1,
    logistics_hub_id: params.logistics_hub_id
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

  await ensureDocks(client, warehouse.id, params.docks ?? DEFAULT_DOCKS);

  return {
    warehouse_id: warehouse.id,
    floor_id: floor.id,
    aisle_ids,
    slot_ids,
    reused: false
  };
}
