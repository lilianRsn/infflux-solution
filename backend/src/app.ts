import express, { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import orderRoutes from "./modules/orders/orders.routes";
import clientWarehousesRoutes from "./modules/client-warehouses/client-warehouses.routes";
import storageSlotsRoutes from "./modules/storage-slots/storage-slots.routes";
import loadingDocksRoutes from "./modules/loading-docks/loading-docks.routes";
import usersRoutes from "./modules/users/users.routes";
import authenticateToken from "./common/guards/auth.guard";

const app: Express = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
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

app.use((_req: Request, res: Response) =>
  res.status(404).json({ message: "Route not found" })
);

export default app;