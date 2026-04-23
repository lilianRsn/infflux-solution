import { Request, Response } from "express";
import { getClientUsers } from "./users.service";

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
