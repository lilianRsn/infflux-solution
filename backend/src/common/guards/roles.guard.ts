import { Request, Response, NextFunction } from "express";

type UserRole = "admin" | "client" | "partner";

export default function requireRoles(...allowedRoles: UserRole[]) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): Response | void => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
}
