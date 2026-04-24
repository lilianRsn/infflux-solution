import { Router } from "express";
import requireRoles from "../../common/guards/roles.guard";
import {
  createOrderHandler,
  getAllOrdersHandler,
  getMyOrdersHandler,
  getOrderByIdHandler
} from "./orders.controller";

const router = Router();

router.post("/", requireRoles("admin", "client"), createOrderHandler);
router.get("/me", requireRoles("client"), getMyOrdersHandler);
router.get("/", requireRoles("admin"), getAllOrdersHandler);
router.get("/:id", requireRoles("admin", "client"), getOrderByIdHandler);

export default router;
