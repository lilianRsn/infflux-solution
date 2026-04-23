CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS order_lines CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client', 'partner')),
  company_name TEXT NOT NULL,
  billing_address TEXT,
  main_contact_name TEXT,
  main_contact_phone TEXT,
  main_contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,

  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  billing_address TEXT,
  main_contact_name TEXT,
  main_contact_phone TEXT,
  main_contact_email TEXT,

  delivery_address TEXT NOT NULL,
  site_name TEXT,
  delivery_contact_name TEXT,
  delivery_contact_phone TEXT,

  requested_delivery_date DATE NOT NULL,
  delivery_time_window TEXT NOT NULL CHECK (delivery_time_window IN ('morning', 'afternoon', 'full_day')),
  urgency_level TEXT NOT NULL CHECK (urgency_level IN ('urgent', 'standard', 'flexible')),

  can_receive_early BOOLEAN NOT NULL DEFAULT FALSE,
  earliest_acceptable_delivery_date DATE,
  can_store_early_delivery BOOLEAN NOT NULL DEFAULT FALSE,
  available_storage_capacity_pallets INTEGER,
  grouped_delivery_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  latest_acceptable_grouped_delivery_date DATE,
  split_delivery_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  partner_delivery_allowed BOOLEAN NOT NULL DEFAULT FALSE,

  status TEXT NOT NULL DEFAULT 'pending',
  total_pallets INTEGER NOT NULL DEFAULT 0,

  eligible_for_early_delivery BOOLEAN NOT NULL DEFAULT FALSE,
  eligible_for_grouped_delivery BOOLEAN NOT NULL DEFAULT FALSE,
  eligible_for_partner_carrier BOOLEAN NOT NULL DEFAULT FALSE,
  eligible_for_route_fillup BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_flexibility_score INTEGER NOT NULL DEFAULT 0,

  promised_delivery_date DATE,
  promised_time_window TEXT,
  service_level TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  quantity_pallets INTEGER NOT NULL CHECK (quantity_pallets > 0)
);
