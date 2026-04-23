import { Request, Response } from "express";
import { AppError } from "../../common/errors/app-error";
import { loginUser, registerUser } from "./auth.service";
import { LoginBody, RegisterBody } from "./auth.types";

export async function register(
  req: Request<{}, {}, RegisterBody>,
  res: Response
): Promise<Response> {
  try {
    const result = await registerUser(req.body);
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

export async function login(
  req: Request<{}, {}, LoginBody>,
  res: Response
): Promise<Response> {
  try {
    const result = await loginUser(req.body);
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
