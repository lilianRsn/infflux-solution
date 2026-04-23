-- Mock Users
-- Passwords are all 'password123' (hash: $2a$10$vI8qO7B8C8K8B8C8K8B8COvI8qO7B8C8K8B8C8K8B8C8K8B8C8K8B8)
-- Actually I will use a real hash for 'password123'
-- Hash for 'password123': $2a$10$K9pB.P7Jz8V8K7X6W5V4U3T2S1R0Q9P8O7N6M5L4K3J2I1H0G9F8

INSERT INTO users (email, password_hash, role, company_name, main_contact_name)
VALUES 
('admin@infflux.com', '$2a$10$gDSmV0EsryJ5TioPxvAKq.pQ1mtJoayJdExUE7Gorz31xFJwMfEDu', 'admin', 'Infflux', 'Admin Infflux'),
('client@demo.com', '$2a$10$gDSmV0EsryJ5TioPxvAKq.pQ1mtJoayJdExUE7Gorz31xFJwMfEDu', 'client', 'Dupont SAS', 'Jean Dupont'),
('partenaire@translog.com', '$2a$10$gDSmV0EsryJ5TioPxvAKq.pQ1mtJoayJdExUE7Gorz31xFJwMfEDu', 'partner', 'TransLog Express', 'Marie Leroy');
