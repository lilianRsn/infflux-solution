import { ApiClient } from "../../shared/api-client";
import {
  listWarehousesByClient,
  getWarehouseLayout,
  createFloor,
  createAisle,
  createStorageSlot,
  patchStorageSlot,
  WarehouseLayoutAisle
} from "../../shared/warehouses-api";
import { StockMarchand } from "../storage/model";
import { computeSlotPayload, occupationCartons } from "./slot-payload";
import {
  registerStock,
  StockRegistration,
  WarehouseRegistrationParams
} from "./register-stock";

/**
 * Déclare le stock au backend en réutilisant l'entrepôt existant du client
 * s'il a déjà été créé lors d'un run précédent. L'identification se fait
 * par le nom d'entrepôt (params.warehouse_name). Si l'entrepôt existe,
 * son layout est récupéré et :
 *   - les floors/aisles/slots déjà présents sont mappés par leur clé
 *     naturelle (level, code, rank) et leurs slots sont patchés pour
 *     refléter l'état local ;
 *   - les éléments manquants sont créés.
 *
 * Si aucun entrepôt ne matche, on retombe sur registerStock (création
 * complète) — comportement identique au 1er run.
 */
export async function ensureStockRegistration(
  client: ApiClient,
  stock: StockMarchand,
  params: WarehouseRegistrationParams,
  clientUserId: string
): Promise<StockRegistration> {
  const existing = await listWarehousesByClient(client, clientUserId);
  const ours = existing.find((w) => w.name === params.warehouse_name);

  if (!ours) {
    return registerStock(client, stock, params);
  }

  const layout = await getWarehouseLayout(client, ours.id);

  const existingFloor = layout.floors.find((f) => f.level === params.floor_level);
  let floorId: string;
  let aislesInFloor: WarehouseLayoutAisle[];
  if (existingFloor) {
    floorId = existingFloor.id;
    aislesInFloor = existingFloor.aisles ?? [];
  } else {
    const created = await createFloor(client, ours.id, {
      level: params.floor_level,
      label: params.floor_label
    });
    floorId = created.id;
    aislesInFloor = [];
  }

  const aisle_ids: Record<string, string> = {};
  const slot_ids: Record<string, string> = {};

  for (const allee of stock.allees) {
    const existingAisle = aislesInFloor.find((a) => a.code === allee.allee_id);
    let aisleId: string;
    let slotsInAisle: WarehouseLayoutAisle["slots"];
    if (existingAisle) {
      aisleId = existingAisle.id;
      slotsInAisle = existingAisle.slots ?? [];
    } else {
      const created = await createAisle(client, floorId, { code: allee.allee_id });
      aisleId = created.id;
      slotsInAisle = [];
    }
    aisle_ids[allee.allee_id] = aisleId;

    for (const rangee of allee.rangees) {
      const payload = computeSlotPayload({
        capacite_cartons: rangee.capacite_cartons,
        cartons_occupes: occupationCartons(rangee),
        cartons_par_palette: stock.cartons_par_palette,
        m3_par_carton: params.m3_par_carton
      });

      const existingSlot = slotsInAisle.find((s) => s.rank === rangee.rangee_id);
      if (existingSlot) {
        await patchStorageSlot(client, existingSlot.id, payload);
        slot_ids[rangee.rangee_id] = existingSlot.id;
      } else {
        const created = await createStorageSlot(client, {
          aisle_id: aisleId,
          rank: rangee.rangee_id,
          side: params.slot_side,
          ...payload
        });
        slot_ids[rangee.rangee_id] = created.id;
      }
    }
  }

  return {
    warehouse_id: ours.id,
    floor_id: floorId,
    aisle_ids,
    slot_ids,
    reused: true
  };
}
