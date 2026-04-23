import { cartonsToPalettes } from "../storage/convert";
import { Rangee } from "../storage/model";
import { SlotStatus } from "../../shared/warehouses-api";

export interface SlotPayloadParams {
  capacite_cartons: number;
  cartons_occupes: number;
  cartons_par_palette: number;
  m3_par_carton: number;
}

export interface SlotPayload {
  total_volume: number;
  used_volume: number;
  total_pallets: number;
  used_pallets: number;
  status: SlotStatus;
}

export function computeSlotPayload(params: SlotPayloadParams): SlotPayload {
  if (params.m3_par_carton <= 0) {
    throw new RangeError("m3_par_carton must be > 0");
  }
  if (params.cartons_occupes < 0) {
    throw new RangeError("cartons_occupes must be >= 0");
  }
  if (params.cartons_occupes > params.capacite_cartons) {
    throw new RangeError("cartons_occupes cannot exceed capacite_cartons");
  }

  const total_pallets = cartonsToPalettes(params.capacite_cartons, params.cartons_par_palette);
  const used_pallets = cartonsToPalettes(params.cartons_occupes, params.cartons_par_palette);
  const total_volume = round2(params.capacite_cartons * params.m3_par_carton);
  const used_volume = round2(params.cartons_occupes * params.m3_par_carton);
  const status = deriveStatus(params.cartons_occupes, params.capacite_cartons);

  return { total_volume, used_volume, total_pallets, used_pallets, status };
}

export function occupationCartons(rangee: Rangee): number {
  return rangee.cartons.reduce((sum, c) => sum + c.quantite_cartons, 0);
}

export function deriveStatus(occupes: number, capacite: number): SlotStatus {
  if (capacite === 0 || occupes === 0) return "FREE";
  if (occupes >= capacite) return "FULL";
  return "PARTIAL";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
