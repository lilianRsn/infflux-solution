import { Request, Response } from "express";
import { AppError } from "../../common/errors/app-error";
import {
  createTruck,
  deleteTruck,
  getTruckById,
  listAvailableTrucks,
  listTrucks,
  updateTruck,
} from "./trucks.service";
import { CreateTruckBody, UpdateTruckBody } from "./trucks.types";

function handleError(error: unknown, res: Response): Response {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  return res.status(500).json({
    message: error instanceof Error ? error.message : "Internal server error",
  });
}

export async function listTrucksHandler(_req: Request, res: Response): Promise<Response> {
  try {
    return res.json(await listTrucks());
  } catch (error) {
    return handleError(error, res);
  }
}

export async function listAvailableTrucksHandler(req: Request, res: Response): Promise<Response> {
  try {
    const minPallets = req.query.min_pallets ? Number(req.query.min_pallets) : undefined;
    return res.json(await listAvailableTrucks(minPallets));
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getTruckByIdHandler(
  req: Request<{ id: string }>,
  res: Response
): Promise<Response> {
  try {
    return res.json(await getTruckById(req.params.id));
  } catch (error) {
    return handleError(error, res);
  }
}

export async function createTruckHandler(
  req: Request<{}, {}, CreateTruckBody>,
  res: Response
): Promise<Response> {
  try {
    return res.status(201).json(await createTruck(req.body));
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateTruckHandler(
  req: Request<{ id: string }, {}, UpdateTruckBody>,
  res: Response
): Promise<Response> {
  try {
    return res.json(await updateTruck(req.params.id, req.body));
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteTruckHandler(
  req: Request<{ id: string }>,
  res: Response
): Promise<Response> {
  try {
    await deleteTruck(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
}