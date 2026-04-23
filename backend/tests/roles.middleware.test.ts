/// <reference types="jest" />

import { Request, Response, NextFunction } from "express";
import requireRoles from "../src/common/guards/roles.guard";

describe("requireRoles middleware", () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  } as unknown as Response;

  const next = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when req.user is missing", () => {
    const req = {} as Request;
    const middleware = requireRoles("admin");

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when role is not allowed", () => {
    const req = {
      user: {
        id: "1",
        email: "client@example.com",
        role: "client"
      }
    } as Request;

    const middleware = requireRoles("admin");

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when role is allowed", () => {
    const req = {
      user: {
        id: "1",
        email: "admin@example.com",
        role: "admin"
      }
    } as Request;

    const middleware = requireRoles("admin", "client");

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
