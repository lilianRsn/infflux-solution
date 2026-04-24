import { Router } from "express";
import requireRoles from "../../common/guards/roles.guard";
import {
  assignOrderToTruckHandler,
  createOrderHandler,
  getAllOrdersHandler,
  getMyOrdersHandler,
  getOrderByIdHandler,
  getOrdersByWarehouseHandler
} from "./orders.controller";

const router = Router();

router.post("/", requireRoles("admin", "client"), createOrderHandler);
router.get("/me", requireRoles("client"), getMyOrdersHandler);
router.get("/warehouse/:warehouseId", requireRoles("admin", "client"), getOrdersByWarehouseHandler);
router.get("/", requireRoles("admin"), getAllOrdersHandler);
router.post("/:id/assign", requireRoles("admin"), assignOrderToTruckHandler);
router.get("/:id", requireRoles("admin", "client"), getOrderByIdHandler);

export default router;
