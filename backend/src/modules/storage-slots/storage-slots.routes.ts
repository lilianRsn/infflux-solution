import { Router } from "express";
import requireRoles from "../../common/guards/roles.guard";
import { createStorageSlotHandler, patchStorageSlotHandler } from "./storage-slots.controller";

const router = Router();
router.post("/", requireRoles("admin", "client"), createStorageSlotHandler);
router.patch("/:id", requireRoles("admin", "client"), patchStorageSlotHandler);
export default router;
