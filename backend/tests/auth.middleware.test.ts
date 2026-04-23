/// <reference types="jest" />

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import authenticateToken from "../src/middleware/auth";

describe("authenticateToken middleware", () => {
  const originalSecret = process.env.JWT_SECRET;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  } as unknown as Response;

  const next = jest.fn() as NextFunction;

  beforeEach(() => {
    process.env.JWT_SECRET = "test_secret";
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it("returns 401 when authorization header is missing", () => {
    const req = {
      headers: {}
    } as Request;

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Missing or invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid", () => {
    const req = {
      headers: {
        authorization: "Bearer invalid-token"
      }
    } as Request;

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches req.user and calls next when token is valid", () => {
    const token = jwt.sign(
      {
        sub: "user-1",
        email: "client@example.com",
        role: "client"
      },
      process.env.JWT_SECRET as string
    );

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    } as Request;

    authenticateToken(req, res, next);

    expect(req.user).toEqual({
      id: "user-1",
      email: "client@example.com",
      role: "client"
    });
    expect(next).toHaveBeenCalled();
  });
});
