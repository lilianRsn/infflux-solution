import { Request, Response } from "express";
import { AppError } from "../../common/errors/app-error";
import { assignOrderToTruck, createOrder, getAllOrders, getMyOrders, getOrderById, getOrdersByWarehouse } from "./orders.service";
import { CreateOrderBody } from "./orders.types";

export async function createOrderHandler(
  req: Request<{}, {}, CreateOrderBody>,
  res: Response
): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await createOrder(req.body, req.user);
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

export async function getMyOrdersHandler(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await getMyOrders(req.user.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error"
    });
  }
}

export async function getAllOrdersHandler(
  _req: Request,
  res: Response
): Promise<Response> {
  try {
    const result = await getAllOrders();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error"
    });
  }
}

export async function getOrderByIdHandler(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await getOrderById(String(req.params.id), req.user);
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

export async function getOrdersByWarehouseHandler(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const result = await getOrdersByWarehouse(String(req.params.warehouseId), req.user);
    return res.json(result);
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
    return res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
  }
}

export async function assignOrderToTruckHandler(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { truck_id, destination_warehouse_id } = req.body as {
      truck_id: string;
      destination_warehouse_id?: string;
    };
    if (!truck_id) return res.status(400).json({ message: "truck_id is required" });
    const result = await assignOrderToTruck(
      String(req.params.id),
      truck_id,
      destination_warehouse_id,
      req.user
    );
    return res.json(result);
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
    return res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
  }
}
