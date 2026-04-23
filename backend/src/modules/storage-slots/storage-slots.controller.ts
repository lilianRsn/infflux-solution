import { Request, Response } from "express";
import { AppError } from "../../common/errors/app-error";
import { createStorageSlot, patchStorageSlot } from "./storage-slots.service";
import { CreateStorageSlotBody, PatchStorageSlotBody } from "./storage-slots.types";

const fail = (res: Response, e: unknown) => e instanceof AppError ? res.status(e.statusCode).json({ message: e.message }) : res.status(500).json({ message: e instanceof Error ? e.message : "Internal server error" });

export const createStorageSlotHandler = async (req: Request<{}, {}, CreateStorageSlotBody>, res: Response) => { try { if (!req.user) return res.status(401).json({ message: "Unauthorized" }); return res.status(201).json(await createStorageSlot(req.body, req.user)); } catch (e) { return fail(res, e); } };
export const patchStorageSlotHandler = async (req: Request<{ id: string }, {}, PatchStorageSlotBody>, res: Response) => { try { if (!req.user) return res.status(401).json({ message: "Unauthorized" }); return res.json(await patchStorageSlot(req.params.id, req.body, req.user)); } catch (e) { return fail(res, e); } };
