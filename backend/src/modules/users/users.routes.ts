import { Router } from "express";
import requireRoles from "../../common/guards/roles.guard";
import { getClientsHandler } from "./users.controller";

const router = Router();

router.get("/clients", requireRoles("admin"), getClientsHandler);

export default router;
