CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS delivery_plan_docks CASCADE;
DROP TABLE IF EXISTS delivery_plan_trucks CASCADE;
DROP TABLE IF EXISTS delivery_plan_orders CASCADE;
DROP TABLE IF EXISTS delivery_plans CASCADE;
DROP TABLE IF EXISTS trucks CASCADE;
DROP TABLE IF EXISTS parking_zones CASCADE;
DROP TABLE IF EXISTS loading_docks CASCADE;
DROP TABLE IF EXISTS client_warehouse_exteriors CASCADE;
DROP TABLE IF EXISTS storage_slots CASCADE;
DROP TABLE IF EXISTS warehouse_aisles CASCADE;
DROP TABLE IF EXISTS warehouse_floors CASCADE;
DROP TABLE IF EXISTS order_lines CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS client_warehouses CASCADE;
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

CREATE TABLE client_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  floors_count INTEGER NOT NULL DEFAULT 1 CHECK (floors_count > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE warehouse_floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_warehouse_id UUID NOT NULL REFERENCES client_warehouses(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_warehouse_id, level)
);

CREATE TABLE warehouse_aisles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID NOT NULL REFERENCES warehouse_floors(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  position_x NUMERIC(10,2),
  position_y NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (floor_id, code)
);

CREATE TABLE storage_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aisle_id UUID NOT NULL REFERENCES warehouse_aisles(id) ON DELETE CASCADE,
  rank TEXT NOT NULL,
  side TEXT NOT NULL,
  total_volume NUMERIC(10,2) NOT NULL CHECK (total_volume >= 0),
  used_volume NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (used_volume >= 0),
  total_pallets INTEGER,
  used_pallets INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('FREE', 'PARTIAL', 'FULL')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  CHECK (used_volume <= total_volume),
  CHECK (total_pallets IS NULL OR total_pallets >= 0),
  CHECK (used_pallets IS NULL OR used_pallets >= 0),
  CHECK (total_pallets IS NULL OR used_pallets <= total_pallets)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  client_warehouse_id UUID REFERENCES client_warehouses(id) ON DELETE SET NULL,
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
  planning_status TEXT NOT NULL DEFAULT 'UNPLANNED' CHECK (
    planning_status IN ('UNPLANNED', 'PARTIALLY_PLANNED', 'PLANNED', 'BLOCKED', 'DELIVERED')
  ),
  blocked_reason TEXT,
  planned_delivery_date DATE,
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

CREATE TABLE client_warehouse_exteriors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_warehouse_id UUID NOT NULL UNIQUE REFERENCES client_warehouses(id) ON DELETE CASCADE,
  site_width NUMERIC(10,2) NOT NULL,
  site_height NUMERIC(10,2) NOT NULL,
  building_x NUMERIC(10,2) NOT NULL,
  building_y NUMERIC(10,2) NOT NULL,
  building_width NUMERIC(10,2) NOT NULL,
  building_height NUMERIC(10,2) NOT NULL,
  access_direction TEXT NOT NULL CHECK (access_direction IN ('N', 'S', 'E', 'W')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE loading_docks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_warehouse_id UUID NOT NULL REFERENCES client_warehouses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  position_x NUMERIC(10,2) NOT NULL,
  position_y NUMERIC(10,2) NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('N', 'S', 'E', 'W')),
  max_tonnage NUMERIC(10,2),
  max_width_meters NUMERIC(10,2),
  status TEXT NOT NULL CHECK (status IN ('FREE', 'OCCUPIED', 'MAINTENANCE')),
  current_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_warehouse_id, code)
);

CREATE TABLE parking_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_warehouse_id UUID NOT NULL REFERENCES client_warehouses(id) ON DELETE CASCADE,
  position_x NUMERIC(10,2) NOT NULL,
  position_y NUMERIC(10,2) NOT NULL,
  width NUMERIC(10,2) NOT NULL,
  height NUMERIC(10,2) NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trucks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  license_plate TEXT NOT NULL UNIQUE,
  max_palettes INTEGER NOT NULL DEFAULT 20 CHECK (max_palettes > 0),
  max_weight_kg NUMERIC(10,2) NOT NULL DEFAULT 20000 CHECK (max_weight_kg >= 0),
  max_volume_m3 NUMERIC(10,2) NOT NULL DEFAULT 40.0 CHECK (max_volume_m3 >= 0),
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ON_ROUTE', 'LOADING', 'MAINTENANCE')),
  current_route TEXT,
  fill_percent INTEGER DEFAULT 0 CHECK (fill_percent >= 0 AND fill_percent <= 100),
  driver_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE delivery_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planned_delivery_date DATE NOT NULL,
  planned_time_window TEXT NOT NULL CHECK (planned_time_window IN ('morning', 'afternoon', 'full_day')),
  client_warehouse_id UUID NOT NULL REFERENCES client_warehouses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED')),
  total_pallets INTEGER NOT NULL DEFAULT 0 CHECK (total_pallets >= 0),
  total_volume_m3 NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_volume_m3 >= 0),
  priority_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



CREATE TABLE delivery_plan_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_plan_id UUID NOT NULL REFERENCES delivery_plans(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  allocated_pallets INTEGER NOT NULL CHECK (allocated_pallets > 0)
);

CREATE TABLE delivery_plan_trucks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_plan_id UUID NOT NULL REFERENCES delivery_plans(id) ON DELETE CASCADE,
  truck_id UUID NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
  assigned_pallets INTEGER NOT NULL CHECK (assigned_pallets > 0),
  assigned_volume_m3 NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (assigned_volume_m3 >= 0)
);

CREATE TABLE delivery_plan_docks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_plan_id UUID NOT NULL REFERENCES delivery_plans(id) ON DELETE CASCADE,
  loading_dock_id UUID NOT NULL REFERENCES loading_docks(id) ON DELETE CASCADE,
  truck_id UUID NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
  UNIQUE (delivery_plan_id, loading_dock_id),
  UNIQUE (delivery_plan_id, truck_id)
);
