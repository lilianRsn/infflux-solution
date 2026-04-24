import { Request, Response } from "express";
import { AppError } from "../../common/errors/app-error";
import {
  generateDeliveryPlans,
  getDeliveryPlanById,
  listDeliveryPlans,
  reprogramOrder,
  updateDeliveryPlanStatus,
  validateDeliveryPlan
} from "./delivery-plans.service";
import {
  ReprogramOrderBody,
  UpdateDeliveryPlanStatusBody
} from "./delivery-plans.types";

export async function generateDeliveryPlansHandler(
  _req: Request,
  res: Response
): Promise<Response> {
  try {
    const result = await generateDeliveryPlans();
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

export async function listDeliveryPlansHandler(
  _req: Request,
  res: Response
): Promise<Response> {
  try {
    const result = await listDeliveryPlans();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error"
    });
  }
}

export async function getDeliveryPlanByIdHandler(
  req: Request<{ id: string }>,
  res: Response
): Promise<Response> {
  try {
    const result = await getDeliveryPlanById(req.params.id);
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

export async function updateDeliveryPlanStatusHandler(
  req: Request<{ id: string }, {}, UpdateDeliveryPlanStatusBody>,
  res: Response
): Promise<Response> {
  try {
    const result = await updateDeliveryPlanStatus(req.params.id, req.body.status);
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

export async function validateDeliveryPlanHandler(
  req: Request<{ id: string }>,
  res: Response
): Promise<Response> {
  try {
    const result = await validateDeliveryPlan(req.params.id);
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

export async function reprogramOrderHandler(
  req: Request<{ orderId: string }, {}, ReprogramOrderBody>,
  res: Response
): Promise<Response> {
  try {
    const result = await reprogramOrder(req.params.orderId, req.body);
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
