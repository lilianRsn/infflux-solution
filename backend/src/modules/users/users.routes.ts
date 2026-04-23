import { Router } from "express";
import requireRoles from "../../common/guards/roles.guard";
import { getClientsHandler, getMeHandler, updateMeHandler } from "./users.controller";

const router = Router();

router.get("/me", requireRoles("admin", "client", "partner"), getMeHandler);
router.patch("/me", requireRoles("admin", "client", "partner"), updateMeHandler);
router.get("/clients", requireRoles("admin"), getClientsHandler);

export default router;
