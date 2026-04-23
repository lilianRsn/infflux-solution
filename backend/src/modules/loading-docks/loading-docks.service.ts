import pool from "../../infrastructure/database/db";
import { AppError } from "../../common/errors/app-error";
import { PatchLoadingDockBody } from "./loading-docks.types";

type AuthUser = { id: string; role: "admin" | "client" | "partner" };

async function assertDockAccess(dockId: string, user: AuthUser) {
  if (user.role === "admin") return;
  const r = await pool.query(
    `SELECT ld.id FROM loading_docks ld JOIN client_warehouses cw ON cw.id=ld.client_warehouse_id WHERE ld.id=$1 AND cw.client_id=$2`,
    [dockId, user.id]
  );
  if (!r.rows.length) throw new AppError("Forbidden", 403);
}
export async function patchLoadingDock(dockId: string, body: PatchLoadingDockBody, user: AuthUser) {
  await assertDockAccess(dockId, user);
  const cur = await pool.query(`SELECT * FROM loading_docks WHERE id=$1`, [dockId]);
  if (!cur.rows.length) throw new AppError("Loading dock not found", 404);
  const c = cur.rows[0];
  const status = body.status ?? c.status;
  const currentOrderId = status === "FREE" ? null : body.current_order_id ?? c.current_order_id;
  const r = await pool.query(
    `UPDATE loading_docks SET status=$2,current_order_id=$3,max_tonnage=$4,max_width_meters=$5,updated_at=NOW() WHERE id=$1 RETURNING *`,
    [dockId, status, currentOrderId, body.max_tonnage ?? c.max_tonnage, body.max_width_meters ?? c.max_width_meters]
  );
  return r.rows[0];
}
