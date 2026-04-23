import { Request, Response } from "express";
import { AppError } from "../../common/errors/app-error";
import { createTruck, listTrucks, updateTruck } from "./trucks.service";
import { CreateTruckBody, UpdateTruckBody } from "./trucks.types";

export async function createTruckHandler(
  req: Request<{}, {}, CreateTruckBody>,
  res: Response
): Promise<Response> {
  try {
    const result = await createTruck(req.body);
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error"
    });
  }
}

export async function listTrucksHandler(
  _req: Request,
  res: Response
): Promise<Response> {
  try {
    const result = await listTrucks();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error"
    });
  }
}

export async function updateTruckHandler(
  req: Request<{ id: string }, {}, UpdateTruckBody>,
  res: Response
): Promise<Response> {
  try {
    const result = await updateTruck(req.params.id, req.body);
    return res.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error"
    });
  }
}
