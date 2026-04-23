import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface TokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: "admin" | "client" | "partner";
}

export default function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
