import { Request, Response } from "express";
import { AppError } from "../../common/errors/app-error";
import { createOrder, getAllOrders, getMyOrders } from "./orders.service";
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
