import { Request, Response } from "express";
import { AppError } from "../../common/errors/app-error";
import { patchLoadingDock } from "./loading-docks.service";
import { PatchLoadingDockBody } from "./loading-docks.types";

export const patchLoadingDockHandler = async (req: Request<{ id: string }, {}, PatchLoadingDockBody>, res: Response) => {
  try { if (!req.user) return res.status(401).json({ message: "Unauthorized" }); return res.json(await patchLoadingDock(req.params.id, req.body, req.user)); }
  catch (e) { return e instanceof AppError ? res.status(e.statusCode).json({ message: e.message }) : res.status(500).json({ message: e instanceof Error ? e.message : "Internal server error" }); }
};
