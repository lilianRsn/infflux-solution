import { Request, Response } from "express";
import { AppError } from "../../common/errors/app-error";
import { getClientUsers, getMe, UpdateMeBody, updateMe } from "./users.service";

export async function getClientsHandler(
  _req: Request,
  res: Response
): Promise<Response> {
  try {
    const result = await getClientUsers();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error"
    });
  }
}

export async function getMeHandler(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await getMe(req.user.id);
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

export async function updateMeHandler(
  req: Request<{}, {}, UpdateMeBody>,
  res: Response
): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await updateMe(req.user.id, req.body);
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
