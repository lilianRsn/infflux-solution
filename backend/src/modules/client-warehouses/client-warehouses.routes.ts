import { Router } from "express";
import requireRoles from "../../common/guards/roles.guard";
import { createAisleHandler, createDockHandler, createExteriorHandler, createFloorHandler, createParkingHandler, createWarehouseHandler, getAvailabilityHandler, getAvailableDocksHandler, getByClientHandler, getExteriorHandler, getLayoutHandler } from "./client-warehouses.controller";

const router = Router();

router.post("/", requireRoles("admin", "client"), createWarehouseHandler);
router.post("/:id/floors", requireRoles("admin", "client"), createFloorHandler);
router.post("/floors/:floorId/aisles", requireRoles("admin", "client"), createAisleHandler);
router.post("/:id/exterior", requireRoles("admin", "client"), createExteriorHandler);
router.post("/:id/loading-docks", requireRoles("admin", "client"), createDockHandler);
router.post("/:id/parking-zones", requireRoles("admin", "client"), createParkingHandler);

router.get("/availability", requireRoles("admin"), getAvailabilityHandler);
router.get("/:id/layout", requireRoles("admin", "client"), getLayoutHandler);
router.get("/:id/exterior", requireRoles("admin", "client"), getExteriorHandler);
router.get("/:id/docks/available", requireRoles("admin", "client", "partner"), getAvailableDocksHandler);
router.get("/:clientId", requireRoles("admin", "client"), getByClientHandler);

export default router;
