import { Router } from "express";
import requireRoles from "../../common/guards/roles.guard";
import {
  createTruckHandler,
  listTrucksHandler,
  updateTruckHandler
} from "./trucks.controller";

const router = Router();

router.post("/", requireRoles("admin"), createTruckHandler);
router.get("/", requireRoles("admin"), listTrucksHandler);
router.patch("/:id", requireRoles("admin"), updateTruckHandler);

export default router;
