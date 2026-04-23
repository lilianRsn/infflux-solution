import pool from "../../infrastructure/database/db";
import { AppError } from "../../common/errors/app-error";

export interface UpdateMeBody {
  company_name?: string;
  billing_address?: string;
  main_contact_name?: string;
  main_contact_phone?: string;
  main_contact_email?: string;
}

export async function getClientUsers() {
  const result = await pool.query(
    `
    SELECT
      id,
      company_name,
      main_contact_name,
      main_contact_email,
      created_at
    FROM users
    WHERE role = 'client'
    ORDER BY company_name ASC
    `
  );

  return result.rows;
}

export async function getMe(userId: string) {
  const result = await pool.query(
    `
    SELECT
      id,
      email,
      role,
      company_name,
      billing_address,
      main_contact_name,
      main_contact_phone,
      main_contact_email,
      created_at
    FROM users
    WHERE id = $1
    `,
    [userId]
  );

  if (!result.rows.length) {
    throw new AppError("User not found", 404);
  }

  return result.rows[0];
}

export async function updateMe(userId: string, body: UpdateMeBody) {
  const existing = await pool.query(
    `
    SELECT *
    FROM users
    WHERE id = $1
    `,
    [userId]
  );

  if (!existing.rows.length) {
    throw new AppError("User not found", 404);
  }

  const current = existing.rows[0];

  const companyName = body.company_name ?? current.company_name;
  const billingAddress = body.billing_address ?? current.billing_address;
  const mainContactName = body.main_contact_name ?? current.main_contact_name;
  const mainContactPhone = body.main_contact_phone ?? current.main_contact_phone;
  const mainContactEmail = body.main_contact_email ?? current.main_contact_email;

  if (!companyName) {
    throw new AppError("company_name is required", 400);
  }

  const result = await pool.query(
    `
    UPDATE users
    SET
      company_name = $2,
      billing_address = $3,
      main_contact_name = $4,
      main_contact_phone = $5,
      main_contact_email = $6
    WHERE id = $1
    RETURNING
      id,
      email,
      role,
      company_name,
      billing_address,
      main_contact_name,
      main_contact_phone,
      main_contact_email,
      created_at
    `,
    [
      userId,
      companyName,
      billingAddress ?? null,
      mainContactName ?? null,
      mainContactPhone ?? null,
      mainContactEmail ?? null
    ]
  );

  return result.rows[0];
}
