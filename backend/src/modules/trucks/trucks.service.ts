import pool from "../../infrastructure/database/db";
import { AppError } from "../../common/errors/app-error";
import { CreateTruckBody, UpdateTruckBody } from "./trucks.types";

export async function listTrucks() {
  const result = await pool.query(
    `SELECT * FROM trucks ORDER BY name ASC`
  );
  return result.rows;
}

export async function getTruckById(truckId: string) {
  const result = await pool.query(
    `SELECT * FROM trucks WHERE id = $1`,
    [truckId]
  );
  if (!result.rows.length) throw new AppError("Truck not found", 404);
  return result.rows[0];
}

export async function createTruck(body: CreateTruckBody) {
  if (!body.name?.trim()) throw new AppError("name is required", 400);
  if (!body.license_plate?.trim()) throw new AppError("license_plate is required", 400);

  const result = await pool.query(
    `
    INSERT INTO trucks (
      name, license_plate, max_palettes, max_weight_kg, max_volume_m3,
      status, current_route, fill_percent, driver_name, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
    `,
    [
      body.name.trim(),
      body.license_plate.trim().toUpperCase(),
      body.max_palettes ?? 20,
      body.max_weight_kg ?? 20000,
      body.max_volume_m3 ?? 40.0,
      body.status ?? "AVAILABLE",
      body.current_route ?? null,
      body.fill_percent ?? 0,
      body.driver_name ?? null,
      body.notes ?? null,
    ]
  );
  return result.rows[0];
}

export async function updateTruck(truckId: string, body: UpdateTruckBody) {
  const cur = await pool.query(`SELECT * FROM trucks WHERE id = $1`, [truckId]);
  if (!cur.rows.length) throw new AppError("Truck not found", 404);
  const c = cur.rows[0];

  const name = body.name?.trim() ?? c.name;
  const licensePlate = body.license_plate?.trim().toUpperCase() ?? c.license_plate;

  if (!name) throw new AppError("name cannot be empty", 400);
  if (!licensePlate) throw new AppError("license_plate cannot be empty", 400);

  const status = body.status ?? c.status;
  // Quand le camion redevient AVAILABLE, on remet fill_percent à 0 et current_route à null par défaut
  const currentRoute =
    "current_route" in body ? body.current_route ?? null : c.current_route;
  const fillPercent = body.fill_percent ?? c.fill_percent;
  const driverName =
    "driver_name" in body ? body.driver_name ?? null : c.driver_name;
  const notes = "notes" in body ? body.notes ?? null : c.notes;

  const result = await pool.query(
    `
    UPDATE trucks
    SET
      name           = $2,
      license_plate  = $3,
      max_palettes   = $4,
      max_weight_kg  = $5,
      max_volume_m3  = $6,
      status         = $7,
      current_route  = $8,
      fill_percent   = $9,
      driver_name    = $10,
      notes          = $11,
      updated_at     = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [
      truckId,
      name,
      licensePlate,
      body.max_palettes ?? c.max_palettes,
      body.max_weight_kg ?? c.max_weight_kg,
      body.max_volume_m3 ?? c.max_volume_m3,
      status,
      currentRoute,
      fillPercent,
      driverName,
      notes,
    ]
  );
  return result.rows[0];
}

export async function listAvailableTrucks(minPallets?: number) {
  const result = minPallets
    ? await pool.query(
        `SELECT * FROM trucks WHERE status = 'AVAILABLE' AND max_palettes >= $1 ORDER BY max_palettes ASC`,
        [minPallets]
      )
    : await pool.query(`SELECT * FROM trucks WHERE status = 'AVAILABLE' ORDER BY max_palettes ASC`);
  return result.rows;
}

export async function deleteTruck(truckId: string) {
  const cur = await pool.query(`SELECT id, status FROM trucks WHERE id = $1`, [truckId]);
  if (!cur.rows.length) throw new AppError("Truck not found", 404);
  if (cur.rows[0].status === "ON_ROUTE") {
    throw new AppError("Cannot delete a truck that is currently ON_ROUTE", 409);
  }
  await pool.query(`DELETE FROM trucks WHERE id = $1`, [truckId]);
}
