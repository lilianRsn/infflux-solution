import express, { Request, Response } from "express";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/auth.routes";
import orderRoutes from "./routes/order.routes";
import authenticateToken from "./middleware/auth";
import swaggerSpec from "./config/swagger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ message: "API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/orders", authenticateToken, orderRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api/docs`);
});
