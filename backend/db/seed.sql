-- ============================================================
-- Infflux — Seed complet
-- À exécuter APRÈS schema.sql
-- Mot de passe universel : "password123"
-- ============================================================

-- ── 1. Utilisateurs ─────────────────────────────────────────
INSERT INTO users (id, email, password_hash, role, company_name, main_contact_name, main_contact_email, main_contact_phone, billing_address)
VALUES
  ('00000000-0000-0000-0000-000000000001',
   'admin@infflux.com',
   '$2a$10$gDSmV0EsryJ5TioPxvAKq.pQ1mtJoayJdExUE7Gorz31xFJwMfEDu',
   'admin', 'Infflux', 'Admin Infflux', 'admin@infflux.com', NULL, NULL),

  ('00000000-0000-0000-0000-000000000002',
   'client@demo.com',
   '$2a$10$gDSmV0EsryJ5TioPxvAKq.pQ1mtJoayJdExUE7Gorz31xFJwMfEDu',
   'client', 'Dupont SAS', 'Jean Dupont', 'client@demo.com', '06 12 34 56 78', '12 rue de la Paix, 69001 Lyon'),

  ('00000000-0000-0000-0000-000000000003',
   'client2@demo.com',
   '$2a$10$gDSmV0EsryJ5TioPxvAKq.pQ1mtJoayJdExUE7Gorz31xFJwMfEDu',
   'client', 'Martin Logistics', 'Sophie Martin', 'client2@demo.com', '07 98 76 54 32', '8 avenue du Commerce, 38000 Grenoble'),

  ('00000000-0000-0000-0000-000000000004',
   'partenaire@translog.com',
   '$2a$10$gDSmV0EsryJ5TioPxvAKq.pQ1mtJoayJdExUE7Gorz31xFJwMfEDu',
   'partner', 'TransLog Express', 'Marie Leroy', 'partenaire@translog.com', NULL, NULL);

-- ── 2. Camions ───────────────────────────────────────────────
INSERT INTO trucks (id, name, license_plate, max_palettes, max_weight_kg, max_volume_m3, status, current_route, fill_percent, driver_name)
VALUES
  ('10000000-0000-0000-0000-000000000001',
   'Camion T-01', 'AB-101-CD', 24, 26000, 52.0,
   'ON_ROUTE', 'Lyon → Grenoble', 82, 'Pierre Martin'),

  ('10000000-0000-0000-0000-000000000002',
   'Camion T-02', 'AB-102-CD', 20, 19000, 40.0,
   'LOADING', 'Lyon → Valence', 45, 'Sophie Bernard'),

  ('10000000-0000-0000-0000-000000000003',
   'Camion T-03', 'AB-103-CD', 20, 19000, 40.0,
   'AVAILABLE', NULL, 0, NULL),

  ('10000000-0000-0000-0000-000000000004',
   'Camion T-04', 'AB-104-CD', 16, 12000, 32.0,
   'MAINTENANCE', NULL, 0, NULL);

-- ── 3. Entrepôts clients ─────────────────────────────────────
INSERT INTO client_warehouses (id, client_id, name, address, floors_count, logistics_hub_id)
VALUES
  ('20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000002',
   'Entrepôt Dupont Lyon', '45 rue de l''Industrie, 69800 Saint-Priest', 1, 'HUB_LYON'),

  ('20000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000003',
   'Entrepôt Martin Grenoble', '22 avenue des Alpes, 38130 Échirolles', 1, NULL),

  ('20000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000002',
   'Entrepôt Dupont Vénissieux', '18 rue de la Chimie, 69200 Vénissieux', 1, 'HUB_LYON');

-- ── 4. Étages ────────────────────────────────────────────────
INSERT INTO warehouse_floors (id, client_warehouse_id, level, label)
VALUES
  ('30000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001', 0, 'Rez-de-chaussée'),
  ('30000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000002', 0, 'Rez-de-chaussée'),
  ('30000000-0000-0000-0000-000000000003',
   '20000000-0000-0000-0000-000000000003', 0, 'Rez-de-chaussée');

-- ── 5. Allées ────────────────────────────────────────────────
INSERT INTO warehouse_aisles (id, floor_id, code, position_x, position_y)
VALUES
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'A1', 10, 20),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'A2', 10, 60),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'A3', 10, 100),

  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', 'B1', 10, 20),
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', 'B2', 10, 60),
  ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000002', 'B3', 10, 100),

  ('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000003', 'C1', 10, 20),
  ('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000003', 'C2', 10, 60);

-- ── 6. Emplacements de stockage ──────────────────────────────
INSERT INTO storage_slots (aisle_id, rank, side, total_volume, used_volume, total_pallets, used_pallets, status)
VALUES
  -- Dupont Lyon — A1 (allée bien remplie)
  ('40000000-0000-0000-0000-000000000001', '1', 'L', 12.0, 10.0, 6, 5, 'PARTIAL'),
  ('40000000-0000-0000-0000-000000000001', '1', 'R', 12.0, 12.0, 6, 6, 'FULL'),
  ('40000000-0000-0000-0000-000000000001', '2', 'L', 12.0,  6.0, 6, 3, 'PARTIAL'),
  ('40000000-0000-0000-0000-000000000001', '2', 'R', 12.0,  0.0, 6, 0, 'FREE'),
  -- A2 (partiellement libre)
  ('40000000-0000-0000-0000-000000000002', '1', 'L', 12.0,  8.0, 6, 4, 'PARTIAL'),
  ('40000000-0000-0000-0000-000000000002', '1', 'R', 12.0,  0.0, 6, 0, 'FREE'),
  ('40000000-0000-0000-0000-000000000002', '2', 'L', 12.0,  0.0, 6, 0, 'FREE'),
  ('40000000-0000-0000-0000-000000000002', '2', 'R', 12.0,  0.0, 6, 0, 'FREE'),
  -- A3 (libre)
  ('40000000-0000-0000-0000-000000000003', '1', 'L', 12.0,  0.0, 6, 0, 'FREE'),
  ('40000000-0000-0000-0000-000000000003', '1', 'R', 12.0,  0.0, 6, 0, 'FREE'),
  ('40000000-0000-0000-0000-000000000003', '2', 'L', 12.0,  0.0, 6, 0, 'FREE'),
  ('40000000-0000-0000-0000-000000000003', '2', 'R', 12.0,  0.0, 6, 0, 'FREE'),

  -- Martin Grenoble — B1 (saturé)
  ('40000000-0000-0000-0000-000000000004', '1', 'L', 10.0, 10.0, 5, 5, 'FULL'),
  ('40000000-0000-0000-0000-000000000004', '1', 'R', 10.0, 10.0, 5, 5, 'FULL'),
  ('40000000-0000-0000-0000-000000000004', '2', 'L', 10.0,  7.0, 5, 3, 'PARTIAL'),
  ('40000000-0000-0000-0000-000000000004', '2', 'R', 10.0,  4.0, 5, 2, 'PARTIAL'),
  -- B2 (moyennement occupé)
  ('40000000-0000-0000-0000-000000000005', '1', 'L', 10.0,  5.0, 5, 2, 'PARTIAL'),
  ('40000000-0000-0000-0000-000000000005', '1', 'R', 10.0,  0.0, 5, 0, 'FREE'),
  ('40000000-0000-0000-0000-000000000005', '2', 'L', 10.0,  0.0, 5, 0, 'FREE'),
  ('40000000-0000-0000-0000-000000000005', '2', 'R', 10.0,  0.0, 5, 0, 'FREE'),
  -- B3 (libre)
  ('40000000-0000-0000-0000-000000000006', '1', 'L', 10.0,  0.0, 5, 0, 'FREE'),
  ('40000000-0000-0000-0000-000000000006', '1', 'R', 10.0,  0.0, 5, 0, 'FREE'),
  ('40000000-0000-0000-0000-000000000006', '2', 'L', 10.0,  0.0, 5, 0, 'FREE'),
  ('40000000-0000-0000-0000-000000000006', '2', 'R', 10.0,  0.0, 5, 0, 'FREE'),

  -- Dupont Vénissieux — C1/C2 (très disponible)
  ('40000000-0000-0000-0000-000000000007', '1', 'L', 12.0,  2.0, 6, 1, 'PARTIAL'),
  ('40000000-0000-0000-0000-000000000007', '1', 'R', 12.0,  0.0, 6, 0, 'FREE'),
  ('40000000-0000-0000-0000-000000000008', '1', 'L', 12.0,  0.0, 6, 0, 'FREE'),
  ('40000000-0000-0000-0000-000000000008', '1', 'R', 12.0,  0.0, 6, 0, 'FREE');

-- ── 7. Extérieurs entrepôts ──────────────────────────────────
INSERT INTO client_warehouse_exteriors (client_warehouse_id, site_width, site_height, building_x, building_y, building_width, building_height, access_direction)
VALUES
  ('20000000-0000-0000-0000-000000000001', 200, 150, 40, 30, 120, 90, 'S'),
  ('20000000-0000-0000-0000-000000000002', 180, 130, 30, 25, 110, 80, 'N'),
  ('20000000-0000-0000-0000-000000000003', 160, 120, 30, 25, 100, 70, 'E');

-- ── 8. Docks de chargement ───────────────────────────────────
INSERT INTO loading_docks (id, client_warehouse_id, code, position_x, position_y, side, max_tonnage, max_width_meters, status)
VALUES
  -- Dupont Lyon : 3 docks côté sud
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Q1', 60,  120, 'S', 26.0, 2.6, 'FREE'),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Q2', 100, 120, 'S', 19.0, 2.5, 'FREE'),
  ('50000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Q3', 140, 120, 'S', 12.0, 2.4, 'MAINTENANCE'),

  -- Martin Grenoble : 2 docks côté nord
  ('50000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'D1', 50,  25,  'N', 19.0, 2.5, 'FREE'),
  ('50000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 'D2', 100, 25,  'N', 19.0, 2.5, 'FREE'),

  -- Dupont Vénissieux : 2 docks côté est
  ('50000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', 'E1', 130, 60, 'E', 26.0, 2.6, 'FREE'),
  ('50000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000003', 'E2', 130, 90, 'E', 19.0, 2.5, 'FREE');

-- ── 9. Zones de parking ──────────────────────────────────────
INSERT INTO parking_zones (client_warehouse_id, position_x, position_y, width, height, capacity)
VALUES
  ('20000000-0000-0000-0000-000000000001', 10, 90, 25, 30, 8),
  ('20000000-0000-0000-0000-000000000002', 10, 70, 20, 25, 6),
  ('20000000-0000-0000-0000-000000000003', 10, 50, 20, 30, 6);

-- ── 10. Commandes de démo ────────────────────────────────────
INSERT INTO orders (
  id, order_number, customer_id, client_warehouse_id, destination_warehouse_id,
  company_name, billing_address, main_contact_name, main_contact_phone, main_contact_email,
  delivery_address, site_name,
  requested_delivery_date, delivery_time_window, urgency_level,
  can_receive_early, can_store_early_delivery,
  grouped_delivery_allowed, split_delivery_allowed, partner_delivery_allowed,
  status, planning_status, total_pallets,
  eligible_for_early_delivery, eligible_for_grouped_delivery,
  eligible_for_partner_carrier, eligible_for_route_fillup,
  delivery_flexibility_score, promised_delivery_date, promised_time_window, service_level
)
VALUES
  ('60000000-0000-0000-0000-000000000001',
   'ORD-2026-001',
   '00000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   'Dupont SAS', '12 rue de la Paix, 69001 Lyon', 'Jean Dupont', '06 12 34 56 78', 'client@demo.com',
   '45 rue de l''Industrie, 69800 Saint-Priest', 'Entrepôt Dupont Lyon',
   '2026-04-25', 'morning', 'urgent',
   FALSE, FALSE, FALSE, FALSE, FALSE,
   'pending', 'UNPLANNED', 8,
   FALSE, FALSE, FALSE, FALSE,
   100, '2026-04-25', 'morning', 'priority'),

  ('60000000-0000-0000-0000-000000000002',
   'ORD-2026-002',
   '00000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   'Dupont SAS', '12 rue de la Paix, 69001 Lyon', 'Jean Dupont', '06 12 34 56 78', 'client@demo.com',
   '45 rue de l''Industrie, 69800 Saint-Priest', 'Entrepôt Dupont Lyon',
   '2026-04-28', 'afternoon', 'standard',
   TRUE, TRUE, TRUE, FALSE, TRUE,
   'pending', 'UNPLANNED', 12,
   TRUE, TRUE, TRUE, TRUE,
   80, '2026-04-28', 'afternoon', 'standard'),

  ('60000000-0000-0000-0000-000000000003',
   'ORD-2026-003',
   '00000000-0000-0000-0000-000000000003',
   '20000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000002',
   'Martin Logistics', '8 avenue du Commerce, 38000 Grenoble', 'Sophie Martin', '07 98 76 54 32', 'client2@demo.com',
   '22 avenue des Alpes, 38130 Échirolles', 'Entrepôt Martin Grenoble',
   '2026-04-26', 'full_day', 'flexible',
   TRUE, TRUE, TRUE, TRUE, TRUE,
   'pending', 'UNPLANNED', 6,
   TRUE, TRUE, TRUE, TRUE,
   60, '2026-04-26', 'full_day', 'optimized');

-- Lignes de commande
INSERT INTO order_lines (order_id, product_id, quantity_pallets)
VALUES
  ('60000000-0000-0000-0000-000000000001', 'PROD-FROID-001', 5),
  ('60000000-0000-0000-0000-000000000001', 'PROD-SEC-002',   3),
  ('60000000-0000-0000-0000-000000000002', 'PROD-SEC-001',   8),
  ('60000000-0000-0000-0000-000000000002', 'PROD-FRAGILE-003', 4),
  ('60000000-0000-0000-0000-000000000003', 'PROD-SEC-002',   6);

-- ── Vérification ─────────────────────────────────────────────
SELECT 'users'           AS table_name, COUNT(*) FROM users
UNION ALL
SELECT 'trucks',                         COUNT(*) FROM trucks
UNION ALL
SELECT 'client_warehouses',              COUNT(*) FROM client_warehouses
UNION ALL
SELECT 'loading_docks',                  COUNT(*) FROM loading_docks
UNION ALL
SELECT 'storage_slots',                  COUNT(*) FROM storage_slots
UNION ALL
SELECT 'orders',                         COUNT(*) FROM orders;
