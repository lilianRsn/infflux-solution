import { Router } from "express";
import requireRoles from "../../common/guards/roles.guard";
import {
  createTruckHandler,
  deleteTruckHandler,
  getTruckByIdHandler,
  listAvailableTrucksHandler,
  listTrucksHandler,
  updateTruckHandler,
} from "./trucks.controller";

const router = Router();

router.get("/available", requireRoles("admin"), listAvailableTrucksHandler);
router.get("/", requireRoles("admin"), listTrucksHandler);
router.get("/:id", requireRoles("admin"), getTruckByIdHandler);
router.post("/", requireRoles("admin"), createTruckHandler);
router.patch("/:id", requireRoles("admin"), updateTruckHandler);
router.delete("/:id", requireRoles("admin"), deleteTruckHandler);

export default router;