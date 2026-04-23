import pool from "../../infrastructure/database/db";
import { AppError } from "../../common/errors/app-error";
import { CreateTruckBody, UpdateTruckBody } from "./trucks.types";

export async function createTruck(body: CreateTruckBody) {
  if (!body.code || !body.max_pallets || body.max_pallets <= 0) {
    throw new AppError("code and max_pallets > 0 are required", 400);
  }

  const result = await pool.query(
    `
    INSERT INTO trucks (code, max_pallets, max_volume_m3, max_weight_kg, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [
      body.code,
      body.max_pallets,
      body.max_volume_m3 ?? 0,
      body.max_weight_kg ?? 0,
      body.status ?? "AVAILABLE"
    ]
  );

  return result.rows[0];
}

export async function listTrucks() {
  const result = await pool.query(
    `
    SELECT *
    FROM trucks
    ORDER BY code ASC
    `
  );

  return result.rows;
}

export async function updateTruck(truckId: string, body: UpdateTruckBody) {
  const existing = await pool.query(
    `
    SELECT *
    FROM trucks
    WHERE id = $1
    `,
    [truckId]
  );

  if (!existing.rows.length) {
    throw new AppError("Truck not found", 404);
  }

  const current = existing.rows[0];

  const code = body.code ?? current.code;
  const maxPallets = body.max_pallets ?? current.max_pallets;
  const maxVolume = body.max_volume_m3 ?? current.max_volume_m3;
  const maxWeight = body.max_weight_kg ?? current.max_weight_kg;
  const status = body.status ?? current.status;

  if (!code || maxPallets <= 0) {
    throw new AppError("code and max_pallets > 0 are required", 400);
  }

  const result = await pool.query(
    `
    UPDATE trucks
    SET
      code = $2,
      max_pallets = $3,
      max_volume_m3 = $4,
      max_weight_kg = $5,
      status = $6,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [truckId, code, maxPallets, maxVolume, maxWeight, status]
  );

  return result.rows[0];
}
