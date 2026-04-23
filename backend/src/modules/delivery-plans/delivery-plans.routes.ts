import { Router } from "express";
import requireRoles from "../../common/guards/roles.guard";
import {
  generateDeliveryPlansHandler,
  getDeliveryPlanByIdHandler,
  listDeliveryPlansHandler,
  updateDeliveryPlanStatusHandler
} from "./delivery-plans.controller";

const router = Router();

router.post("/generate", requireRoles("admin"), generateDeliveryPlansHandler);
router.get("/", requireRoles("admin"), listDeliveryPlansHandler);
router.get("/:id", requireRoles("admin"), getDeliveryPlanByIdHandler);
router.patch("/:id/status", requireRoles("admin"), updateDeliveryPlanStatusHandler);

export default router;
