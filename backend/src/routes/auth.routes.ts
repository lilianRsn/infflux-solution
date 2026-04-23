import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../db";

dotenv.config();

const router = Router();

interface RegisterBody {
  email: string;
  password: string;
  role?: "admin" | "client" | "partner";
  company_name: string;
  billing_address?: string;
  main_contact_name?: string;
  main_contact_phone?: string;
  main_contact_email?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

router.post(
  "/register",
  async (
    req: Request<{}, {}, RegisterBody>,
    res: Response
  ): Promise<Response> => {
    try {
      const {
        email,
        password,
        role = "client",
        company_name,
        billing_address,
        main_contact_name,
        main_contact_phone,
        main_contact_email
      } = req.body;

      if (!email || !password || !company_name) {
        return res.status(400).json({
          message: "email, password and company_name are required"
        });
      }

      if (!["admin", "client", "partner"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `
        INSERT INTO users (
          email,
          password_hash,
          role,
          company_name,
          billing_address,
          main_contact_name,
          main_contact_phone,
          main_contact_email
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING id, email, role, company_name
        `,
        [
          email,
          passwordHash,
          role,
          company_name,
          billing_address || null,
          main_contact_name || null,
          main_contact_phone || null,
          main_contact_email || email
        ]
      );

      return res.status(201).json({
        message: "User created",
        user: result.rows[0]
      });
    } catch (error) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error"
      });
    }
  }
);

router.post(
  "/login",
  async (
    req: Request<{}, {}, LoginBody>,
    res: Response
  ): Promise<Response> => {
    try {
      const { email, password } = req.body;

      const result = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const user = result.rows[0];
      const passwordMatches = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatches) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "24h" }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          company_name: user.company_name
        }
      });
    } catch (error) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error"
      });
    }
  }
);

export default router;
