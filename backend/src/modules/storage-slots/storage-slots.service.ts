import pool from "../../infrastructure/database/db";
import { AppError } from "../../common/errors/app-error";
import { CreateStorageSlotBody, PatchStorageSlotBody } from "./storage-slots.types";

type AuthUser = { id: string; role: "admin" | "client" | "partner" };

async function assertSlotAccess(slotId: string, user: AuthUser) {
  if (user.role === "admin") return;
  const r = await pool.query(
    `SELECT ss.id FROM storage_slots ss
     JOIN warehouse_aisles wa ON wa.id=ss.aisle_id
     JOIN warehouse_floors wf ON wf.id=wa.floor_id
     JOIN client_warehouses cw ON cw.id=wf.client_warehouse_id
     WHERE ss.id=$1 AND cw.client_id=$2`, [slotId, user.id]
  );
  if (!r.rows.length) throw new AppError("Forbidden", 403);
}
async function assertAisleAccess(aisleId: string, user: AuthUser) {
  if (user.role === "admin") return;
  const r = await pool.query(
    `SELECT wa.id FROM warehouse_aisles wa JOIN warehouse_floors wf ON wf.id=wa.floor_id JOIN client_warehouses cw ON cw.id=wf.client_warehouse_id
     WHERE wa.id=$1 AND cw.client_id=$2`, [aisleId, user.id]
  );
  if (!r.rows.length) throw new AppError("Forbidden", 403);
}
export async function createStorageSlot(body: CreateStorageSlotBody, user: AuthUser) {
  await assertAisleAccess(body.aisle_id, user);
  const usedVolume = body.used_volume ?? 0;
  const usedPallets = body.used_pallets ?? 0;
  if (usedVolume > body.total_volume) throw new AppError("used_volume cannot exceed total_volume", 400);
  if (body.total_pallets != null && usedPallets > body.total_pallets) throw new AppError("used_pallets cannot exceed total_pallets", 400);
  const r = await pool.query(
    `INSERT INTO storage_slots (aisle_id,rank,side,total_volume,used_volume,total_pallets,used_pallets,status,updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [body.aisle_id, body.rank, body.side, body.total_volume, usedVolume, body.total_pallets ?? null, usedPallets, body.status ?? "FREE", user.id]
  );
  return r.rows[0];
}
export async function patchStorageSlot(slotId: string, body: PatchStorageSlotBody, user: AuthUser) {
  await assertSlotAccess(slotId, user);
  const cur = await pool.query(`SELECT * FROM storage_slots WHERE id=$1`, [slotId]);
  if (!cur.rows.length) throw new AppError("Storage slot not found", 404);
  const c = cur.rows[0];
  const total_volume = body.total_volume ?? c.total_volume;
  const used_volume = body.used_volume ?? c.used_volume;
  const total_pallets = body.total_pallets ?? c.total_pallets;
  const used_pallets = body.used_pallets ?? c.used_pallets;
  if (used_volume > total_volume) throw new AppError("used_volume cannot exceed total_volume", 400);
  if (total_pallets != null && used_pallets > total_pallets) throw new AppError("used_pallets cannot exceed total_pallets", 400);
  const r = await pool.query(
    `UPDATE storage_slots SET total_volume=$2,used_volume=$3,total_pallets=$4,used_pallets=$5,status=$6,updated_at=NOW(),updated_by=$7 WHERE id=$1 RETURNING *`,
    [slotId, total_volume, used_volume, total_pallets, used_pallets, body.status ?? c.status, user.id]
  );
  return r.rows[0];
}
