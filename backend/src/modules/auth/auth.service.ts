import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../../infrastructure/database/db";
import { LoginBody, RegisterBody } from "./auth.types";

dotenv.config();

export async function registerUser(body: RegisterBody) {
  const {
    email,
    password,
    role = "client",
    company_name,
    billing_address,
    main_contact_name,
    main_contact_phone,
    main_contact_email
  } = body;

  if (!email || !password || !company_name) {
    throw new Error("email, password and company_name are required");
  }

  if (!["admin", "client", "partner"].includes(role)) {
    throw new Error("Invalid role");
  }

  const existingUser = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("Email already exists");
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

  return {
    message: "User created",
    user: result.rows[0]
  };
}

export async function loginUser(body: LoginBody) {
  const { email, password } = body;

  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid credentials");
  }

  const user = result.rows[0];
  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    throw new Error("Invalid credentials");
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

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      company_name: user.company_name
    }
  };
}