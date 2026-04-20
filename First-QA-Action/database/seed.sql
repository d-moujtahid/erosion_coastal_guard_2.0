-- ============================================================
-- SEED — Données initiales Erosion-Coastal Guard
-- À exécuter APRÈS schema.sql dans phpMyAdmin
-- ============================================================

USE erosion_coastal_guard;

-- ─────────────────────────────────────────────
-- SEED: Rôles RBAC
-- ⚠️  CORRECTION : noms en minuscules pour correspondre à rbac.js
--     rbac.js attend : super_admin, scientist, analyst, operator, viewer
-- ─────────────────────────────────────────────
INSERT INTO roles (role_name, description, can_read, can_write, can_admin, can_audit) VALUES
    ('super_admin', 'Accès complet — gestion système et audit',        1, 1, 1, 1),
    ('scientist',   'Lecture + ajout de mesures GPS terrain + export', 1, 1, 0, 0),
    ('analyst',     'Lecture + génération de rapports de recul',       1, 0, 0, 0),
    ('operator',    'Lecture + déclenchement d alertes manuelles',     1, 1, 0, 0),
    ('viewer',      'Lecture seule — dashboard public',                1, 0, 0, 0);

-- ─────────────────────────────────────────────
-- SEED: Utilisateurs de test
-- Mot de passe pour tous : Test2025!
-- Hash bcrypt généré avec cost=12 : bcrypt.hashSync('Test2025!', 12)
-- ⚠️  En production : changer ces mots de passe immédiatement
-- ─────────────────────────────────────────────
INSERT INTO users (role_id, username, email, password_hash, full_name, organisme) VALUES
    -- super_admin → role_id = 1
    (1, 'admin',      'admin@erosion.ma',
    '$2a$12$HF/ECmhXza.rCtusqSZIWO3Bw81VJRXmJJw4oL7DvIWzeNDIpozLW',
     'Admin Système', 'Erosion-Coastal Guard'),

    -- scientist → role_id = 2
    (2, 'k.benali',   'scientist@erosion.ma',
        '$2a$12$HF/ECmhXza.rCtusqSZIWO3Bw81VJRXmJJw4oL7DvIWzeNDIpozLW',
     'Karim Benali', 'Université Ibn Zohr Agadir'),

    -- analyst → role_id = 3
    (3, 's.ouahbi',   'analyst@erosion.ma',
        '$2a$12$HF/ECmhXza.rCtusqSZIWO3Bw81VJRXmJJw4oL7DvIWzeNDIpozLW',
     'Sara Ouahbi', 'INDH Souss-Massa'),

    -- operator → role_id = 4
    (4, 'm.ait',      'operator@erosion.ma',
        '$2a$12$HF/ECmhXza.rCtusqSZIWO3Bw81VJRXmJJw4oL7DvIWzeNDIpozLW',
     'Mohamed Ait', 'Direction Régionale Environnement'),

    -- viewer → role_id = 5
    (5, 'visiteur',   'viewer@erosion.ma',
        '$2a$12$HF/ECmhXza.rCtusqSZIWO3Bw81VJRXmJJw4oL7DvIWzeNDIpozLW',
     'Visiteur Public', 'Accès lecture');

-- ─────────────────────────────────────────────
-- SEED: Zones côtières (6 zones Agadir + Taghazout)
-- Statuts : RED = critique / ORANGE = modéré / GREEN = stable
-- ─────────────────────────────────────────────
INSERT INTO coastal_zones (zone_name, location, latitude_center, longitude_center, status, area_km2, description) VALUES
    ('Taghazout Nord',   'Taghazout', 30.5440, -9.7080, 'RED',    2.1, 'Zone à recul critique — 47.3m en 10 ans'),
    ('Taghazout Centre', 'Taghazout', 30.5250, -9.7000, 'RED',    1.8, 'Zone à recul critique — 34.8m en 10 ans'),
    ('Taghazout Sud',    'Taghazout', 30.5050, -9.6900, 'ORANGE', 1.6, 'Zone en vigilance — 25.7m en 10 ans'),
    ('Agadir Nord',      'Agadir',    30.4450, -9.6100, 'RED',    3.2, 'Zone à recul critique — 38.1m en 10 ans'),
    ('Agadir Centre',    'Agadir',    30.4200, -9.6050, 'ORANGE', 2.6, 'Zone en vigilance — 31.5m en 10 ans'),
    ('Agadir Sud',       'Agadir',    30.3900, -9.6200, 'GREEN',  2.9, 'Zone stable — 7.4m en 10 ans');

-- ─────────────────────────────────────────────
-- SEED: Mesures de recul pré-calculées (Haversine 2016→2026)
-- Ces données alimentent le dashboard sans recalcul
-- ─────────────────────────────────────────────
INSERT INTO retreat_measurements
    (zone_id, lat_2016, lon_2016, lat_2026, lon_2026,
     years_difference, total_distance_m, annual_retreat_m, computed_by)
VALUES
    (1, 30.5412, -9.7098, 30.5384, -9.7095, 10.00, 47.30, 4.73, 1),
    (2, 30.5234, -9.7130, 30.5210, -9.7128, 10.00, 34.80, 3.48, 1),
    (3, 30.5124, -9.7155, 30.5106, -9.7153, 10.00, 25.70, 2.57, 1),
    (4, 30.4198, -9.6192, 30.4172, -9.6188, 10.00, 38.10, 3.81, 2),
    (5, 30.4024, -9.6228, 30.4002, -9.6224, 10.00, 31.50, 3.15, 2),
    (6, 30.3843, -9.6264, 30.3838, -9.6262, 10.00,  7.40, 0.74, 2);

-- ─────────────────────────────────────────────
-- SEED: Alertes initiales
-- ─────────────────────────────────────────────
INSERT INTO alerts (zone_id, alert_type, urgency_level, message) VALUES
    (1, 'CRITICAL_RETREAT', 'CRITICAL',
     'CRITIQUE — Taghazout Nord : recul de 47.3m détecté (2016→2026). Taux annuel 4.73m/an. Intervention urgente requise.'),
    (4, 'CRITICAL_RETREAT', 'CRITICAL',
     'CRITIQUE — Agadir Nord : recul de 38.1m détecté (2016→2026). Taux annuel 3.81m/an.'),
    (2, 'ZONE_RED_NEW',     'WARNING',
     'VIGILANCE — Taghazout Centre : progression vers statut critique. Taux 3.48m/an.');

-- ─────────────────────────────────────────────
-- SEED: Mesures GPS terrain (coastline_points — 2026)
-- ─────────────────────────────────────────────
INSERT INTO coastline_points
    (zone_id, latitude, longitude, precision_m, acquisition_method, measured_by, measurement_date)
VALUES
    (1, 30.5384, -9.7095, 0.05, 'DGPS',    2, '2026-01-15'),
    (2, 30.5210, -9.7128, 0.05, 'DGPS',    2, '2026-01-15'),
    (3, 30.5106, -9.7153, 0.10, 'GPS_terrain', 4, '2026-01-22'),
    (4, 30.4172, -9.6188, 0.05, 'DGPS',    3, '2026-02-01'),
    (5, 30.4002, -9.6224, 0.10, 'GPS_terrain', 3, '2026-02-01'),
    (6, 30.3838, -9.6262, 0.10, 'GPS_terrain', 4, '2026-02-10');

-- ─────────────────────────────────────────────
-- SEED: Points historiques 2016 (coastline_history)
-- Référence de comparaison pour le calcul Haversine
-- ─────────────────────────────────────────────
INSERT INTO coastline_history
    (zone_id, latitude, longitude, reference_year, source, recorded_by)
VALUES
    (1, 30.5412, -9.7098, 2016, 'IGN Maroc 2016', 1),
    (2, 30.5234, -9.7130, 2016, 'IGN Maroc 2016', 1),
    (3, 30.5124, -9.7155, 2016, 'Landsat 8 2016', 1),
    (4, 30.4198, -9.6192, 2016, 'IGN Maroc 2016', 1),
    (5, 30.4024, -9.6228, 2016, 'Landsat 8 2016', 1),
    (6, 30.3843, -9.6264, 2016, 'Landsat 8 2016', 1);

-- ============================================================
-- FIN DU SEED — 5 rôles, 5 users, 6 zones, mesures 2016+2026
-- ============================================================
