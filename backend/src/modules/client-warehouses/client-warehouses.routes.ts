import { Router } from "express";
import requireRoles from "../../common/guards/roles.guard";
import {
  createAisleHandler,
  createDockHandler,
  createExteriorHandler,
  createFloorHandler,
  createParkingHandler,
  createWarehouseHandler,
  getAvailabilityHandler,
  getAvailableDocksHandler,
  getByClientHandler,
  getExteriorHandler,
  getLayoutHandler,
  updateAisleHandler,
  updateExteriorHandler,
  updateFloorHandler,
  updateParkingHandler,
  updateWarehouseHandler
} from "./client-warehouses.controller";

const router = Router();

router.post("/", requireRoles("admin", "client"), createWarehouseHandler);
router.patch("/:id", requireRoles("admin", "client"), updateWarehouseHandler);

router.post("/:id/floors", requireRoles("admin", "client"), createFloorHandler);
router.patch("/floors/:floorId", requireRoles("admin", "client"), updateFloorHandler);

router.post("/floors/:floorId/aisles", requireRoles("admin", "client"), createAisleHandler);
router.patch("/aisles/:aisleId", requireRoles("admin", "client"), updateAisleHandler);

router.post("/:id/exterior", requireRoles("admin", "client"), createExteriorHandler);
router.patch("/:id/exterior", requireRoles("admin", "client"), updateExteriorHandler);

router.post("/:id/loading-docks", requireRoles("admin", "client"), createDockHandler);

router.post("/:id/parking-zones", requireRoles("admin", "client"), createParkingHandler);
router.patch(
  "/parking-zones/:parkingZoneId",
  requireRoles("admin", "client"),
  updateParkingHandler
);

router.get("/availability", requireRoles("admin"), getAvailabilityHandler);
router.get("/:id/layout", requireRoles("admin", "client"), getLayoutHandler);
router.get("/:id/exterior", requireRoles("admin", "client"), getExteriorHandler);
router.get("/:id/docks/available", requireRoles("admin", "client", "partner"), getAvailableDocksHandler);
router.get("/:clientId", requireRoles("admin", "client"), getByClientHandler);

export default router;
