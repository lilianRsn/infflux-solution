import { Router } from "express";
import requireRoles from "../../common/guards/roles.guard";
import { patchLoadingDockHandler } from "./loading-docks.controller";

const router = Router();
router.patch("/:id", requireRoles("admin", "client"), patchLoadingDockHandler);
export default router;
