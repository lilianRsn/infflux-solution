import express, { Express, Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import authRoutes from "./modules/auth/auth.routes";
import orderRoutes from "./modules/orders/orders.routes";
import clientWarehousesRoutes from "./modules/client-warehouses/client-warehouses.routes";
import storageSlotsRoutes from "./modules/storage-slots/storage-slots.routes";
import loadingDocksRoutes from "./modules/loading-docks/loading-docks.routes";
import usersRoutes from "./modules/users/users.routes";
import trucksRoutes from "./modules/trucks/trucks.routes";
import deliveryPlansRoutes from "./modules/delivery-plans/delivery-plans.routes";
import authenticateToken from "./common/guards/auth.guard";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/api/health", (_req: Request, res: Response) =>
  res.json({ message: "API is running" })
);

app.use("/api/auth", authRoutes);
app.use("/api/orders", authenticateToken, orderRoutes);
app.use("/api/users", authenticateToken, usersRoutes);
app.use("/api/client-warehouses", authenticateToken, clientWarehousesRoutes);
app.use("/api/storage-slots", authenticateToken, storageSlotsRoutes);
app.use("/api/loading-docks", authenticateToken, loadingDocksRoutes);
app.use("/api/trucks", authenticateToken, trucksRoutes);
app.use("/api/delivery-plans", authenticateToken, deliveryPlansRoutes);

app.use((_req: Request, res: Response) =>
  res.status(404).json({ message: "Route not found" })
);

export default app;
