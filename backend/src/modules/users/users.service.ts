import pool from "../../infrastructure/database/db";

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
