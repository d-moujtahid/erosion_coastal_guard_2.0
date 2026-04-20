-- ============================================================
-- PROJECT   : Erosion-Coastal Guard
-- PROGRAM   : Souss-Massa Resilience Prototype 2025-2026
-- DATABASE  : MySQL 8.0+
-- COMPARISON: Coastline 2016 → 2026 (10-year retreat analysis)
-- TEAM      : Architects (manual) + Augmenteds (AI-assisted)
-- ============================================================

CREATE DATABASE IF NOT EXISTS erosion_coastal_guard
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE erosion_coastal_guard;

-- ─────────────────────────────────────────────
-- TABLE: roles  (RBAC minimal)
-- ─────────────────────────────────────────────
CREATE TABLE roles (
    role_id      INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    role_name    VARCHAR(50)    NOT NULL,
    description  VARCHAR(255)   NULL,
    can_read     TINYINT(1)     NOT NULL DEFAULT 1,
    can_write    TINYINT(1)     NOT NULL DEFAULT 0,
    can_admin    TINYINT(1)     NOT NULL DEFAULT 0,
    can_audit    TINYINT(1)     NOT NULL DEFAULT 0,
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_roles      PRIMARY KEY (role_id),
    CONSTRAINT uq_roles_name UNIQUE (role_name)
) ENGINE=InnoDB COMMENT='RBAC — granular permission flags per role';

-- ─────────────────────────────────────────────
-- TABLE: users
-- ─────────────────────────────────────────────
CREATE TABLE users (
    user_id       INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    role_id       INT UNSIGNED   NOT NULL,
    username      VARCHAR(80)    NOT NULL,
    email         VARCHAR(150)   NOT NULL,
    password_hash VARCHAR(255)   NOT NULL COMMENT 'bcrypt cost >= 12',
    full_name     VARCHAR(150)   NULL,
    organisme     VARCHAR(150)   NULL,
    is_active     TINYINT(1)     NOT NULL DEFAULT 1,
    last_login    TIMESTAMP      NULL,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_users       PRIMARY KEY (user_id),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_uname UNIQUE (username),
    CONSTRAINT fk_users_role  FOREIGN KEY (role_id) REFERENCES roles(role_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='System users — linked to RBAC roles';

-- ─────────────────────────────────────────────
-- TABLE: coastal_zones
-- Risk classification per geographic zone
-- ─────────────────────────────────────────────
CREATE TABLE coastal_zones (
    zone_id          INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    zone_name        VARCHAR(100)   NOT NULL,
    location         VARCHAR(100)   NOT NULL COMMENT 'Agadir Nord, Taghazout Sud…',
    latitude_center  DECIMAL(10,7)  NOT NULL,
    longitude_center DECIMAL(10,7)  NOT NULL,
    status           ENUM('GREEN','ORANGE','RED') NOT NULL DEFAULT 'GREEN',
    area_km2         DECIMAL(10,4)  NULL,
    description      TEXT           NULL,
    created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_coastal_zones PRIMARY KEY (zone_id),
    CONSTRAINT uq_zones_name    UNIQUE (zone_name),
    INDEX idx_cz_coords (latitude_center, longitude_center),
    INDEX idx_cz_status (status)
) ENGINE=InnoDB COMMENT='Coastal risk zones — GREEN / ORANGE / RED classification';

-- ─────────────────────────────────────────────
-- TABLE: gps_sensors  (NEW — v2)
-- Physical sensors deployed in coastal zones
-- ─────────────────────────────────────────────
CREATE TABLE gps_sensors (
    sensor_id         INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    zone_id           INT UNSIGNED   NOT NULL,
    sensor_code       VARCHAR(30)    NOT NULL COMMENT 'Field identifier e.g. AGN-001',
    sensor_type       VARCHAR(50)    NULL     COMMENT 'DGPS, RTK, LIDAR, satellite',
    latitude_install  DECIMAL(10,7)  NOT NULL,
    longitude_install DECIMAL(10,7)  NOT NULL,
    precision_m       DECIMAL(5,2)   NULL     COMMENT 'Manufacturer precision in meters',
    status            ENUM('ACTIVE','FAULT','MAINTENANCE') NOT NULL DEFAULT 'ACTIVE',
    install_date      DATE           NOT NULL,
    last_calibration  DATE           NULL,
    CONSTRAINT pk_sensors     PRIMARY KEY (sensor_id),
    CONSTRAINT uq_sensor_code UNIQUE (sensor_code),
    CONSTRAINT fk_sensor_zone FOREIGN KEY (zone_id) REFERENCES coastal_zones(zone_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_sensor_zone (zone_id)
) ENGINE=InnoDB COMMENT='GPS sensors deployed in coastal monitoring zones';

-- ─────────────────────────────────────────────
-- TABLE: coastline_points  (current — 2026)
-- Live GPS measurements of the active coastline
-- ─────────────────────────────────────────────
CREATE TABLE coastline_points (
    point_id           INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    zone_id            INT UNSIGNED   NOT NULL,
    sensor_id          INT UNSIGNED   NULL,
    latitude           DECIMAL(10,7)  NOT NULL,
    longitude          DECIMAL(10,7)  NOT NULL,
    altitude_m         DECIMAL(8,3)   NULL,
    precision_m        DECIMAL(5,2)   NULL,
    acquisition_method VARCHAR(50)    NULL     COMMENT 'DGPS, RTK, satellite…',
    measured_by        INT UNSIGNED   NULL,
    measurement_date   DATE           NOT NULL  COMMENT '2026 current survey',
    is_valid           TINYINT(1)     NOT NULL DEFAULT 1,
    notes              VARCHAR(500)   NULL,
    created_at         TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_coastline_points PRIMARY KEY (point_id),
    CONSTRAINT fk_cp_zone   FOREIGN KEY (zone_id)     REFERENCES coastal_zones(zone_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_cp_sensor FOREIGN KEY (sensor_id)   REFERENCES gps_sensors(sensor_id)
        ON DELETE SET NULL  ON UPDATE CASCADE,
    CONSTRAINT fk_cp_user   FOREIGN KEY (measured_by) REFERENCES users(user_id)
        ON DELETE SET NULL  ON UPDATE CASCADE,
    INDEX idx_cp_coords (latitude, longitude),
    INDEX idx_cp_zone   (zone_id),
    INDEX idx_cp_date   (measurement_date)
) ENGINE=InnoDB COMMENT='Current GPS coastline measurement points — 2026 survey';

-- ─────────────────────────────────────────────
-- TABLE: coastline_history
-- Historical GPS snapshots — 2016 reference baseline
-- KEY COMPARISON: 2016 vs 2026 = 10-year retreat
-- ─────────────────────────────────────────────
CREATE TABLE coastline_history (
    history_id       INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    zone_id          INT UNSIGNED   NOT NULL,
    latitude         DECIMAL(10,7)  NOT NULL,
    longitude        DECIMAL(10,7)  NOT NULL,
    altitude_m       DECIMAL(8,3)   NULL,
    reference_year   YEAR           NOT NULL COMMENT '2016 = historical baseline',
    geom_wkt         TEXT           NULL     COMMENT 'WKT LINESTRING for GIS overlay',
    source           VARCHAR(150)   NULL     COMMENT 'IGN, SHOM, Landsat, aerial…',
    resolution_m     DECIMAL(5,2)   NULL,
    recorded_by      INT UNSIGNED   NULL,
    created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_coastline_history  PRIMARY KEY (history_id),
    CONSTRAINT fk_ch_zone FOREIGN KEY (zone_id)     REFERENCES coastal_zones(zone_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ch_user FOREIGN KEY (recorded_by) REFERENCES users(user_id)
        ON DELETE SET NULL  ON UPDATE CASCADE,
    INDEX idx_ch_zone   (zone_id),
    INDEX idx_ch_year   (reference_year),
    INDEX idx_ch_coords (latitude, longitude)
) ENGINE=InnoDB COMMENT='Historical coastline GPS — 2016 baseline for 10-year retreat comparison vs 2026';

-- ─────────────────────────────────────────────
-- TABLE: retreat_measurements
-- Haversine results: 2016 position → 2026 position
-- ─────────────────────────────────────────────
CREATE TABLE retreat_measurements (
    measure_id       INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    zone_id          INT UNSIGNED   NOT NULL,
    -- 2016 reference position (historic baseline)
    lat_2016         DECIMAL(10,7)  NOT NULL COMMENT 'Historic GPS latitude (2016)',
    lon_2016         DECIMAL(10,7)  NOT NULL COMMENT 'Historic GPS longitude (2016)',
    -- 2026 current position
    lat_2026         DECIMAL(10,7)  NOT NULL COMMENT 'Current GPS latitude (2026)',
    lon_2026         DECIMAL(10,7)  NOT NULL COMMENT 'Current GPS longitude (2026)',
    -- Computed results
    years_difference DECIMAL(5,2)   NOT NULL DEFAULT 10.00 COMMENT '2016 → 2026 = 10 years',
    total_distance_m DECIMAL(12,4)  NOT NULL COMMENT 'Haversine total retreat in meters',
    annual_retreat_m DECIMAL(10,4)  NOT NULL COMMENT 'total_distance_m / years_difference',
    -- Metadata
    computed_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    computed_by      INT UNSIGNED   NULL,
    notes            VARCHAR(500)   NULL,
    CONSTRAINT pk_retreat PRIMARY KEY (measure_id),
    CONSTRAINT fk_rm_zone FOREIGN KEY (zone_id)     REFERENCES coastal_zones(zone_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_rm_user FOREIGN KEY (computed_by) REFERENCES users(user_id)
        ON DELETE SET NULL  ON UPDATE CASCADE,
    INDEX idx_rm_zone (zone_id),
    INDEX idx_rm_date (computed_at)
) ENGINE=InnoDB COMMENT='Haversine retreat computation — 2016 vs 2026 baseline (10 years)';

-- ─────────────────────────────────────────────
-- TABLE: construction_permits
-- Blocked automatically in RED zones via trigger
-- ─────────────────────────────────────────────
CREATE TABLE construction_permits (
    permit_id        INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    zone_id          INT UNSIGNED   NOT NULL,
    applicant_name   VARCHAR(150)   NOT NULL,
    project_title    VARCHAR(250)   NOT NULL,
    project_type     VARCHAR(100)   NULL,
    surface_m2       DECIMAL(10,2)  NULL,
    coord_lat        DECIMAL(10,7)  NULL,
    coord_lon        DECIMAL(10,7)  NULL,
    status           ENUM('PENDING','APPROVED','REJECTED','AUTO_BLOCKED')
                                    NOT NULL DEFAULT 'PENDING',
    rejection_reason VARCHAR(500)   NULL,
    submitted_by     INT UNSIGNED   NULL,
    submitted_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by      INT UNSIGNED   NULL,
    reviewed_at      TIMESTAMP      NULL,
    CONSTRAINT pk_permits     PRIMARY KEY (permit_id),
    CONSTRAINT fk_perm_zone   FOREIGN KEY (zone_id)      REFERENCES coastal_zones(zone_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_perm_submit FOREIGN KEY (submitted_by) REFERENCES users(user_id)
        ON DELETE SET NULL  ON UPDATE CASCADE,
    CONSTRAINT fk_perm_review FOREIGN KEY (reviewed_by)  REFERENCES users(user_id)
        ON DELETE SET NULL  ON UPDATE CASCADE,
    INDEX idx_perm_zone   (zone_id),
    INDEX idx_perm_status (status)
) ENGINE=InnoDB COMMENT='Construction permits — AUTO_BLOCKED in RED zones via BEFORE INSERT trigger';

-- ─────────────────────────────────────────────
-- TABLE: alerts  (NEW — v2)
-- Auto-generated on zone reclassification
-- ─────────────────────────────────────────────
CREATE TABLE alerts (
    alert_id      INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    zone_id       INT UNSIGNED   NULL,
    alert_type    ENUM('CRITICAL_RETREAT','ZONE_RED_NEW','PERMIT_BLOCKED','SENSOR_FAULT')
                                 NOT NULL,
    urgency_level ENUM('INFO','WARNING','CRITICAL') NOT NULL DEFAULT 'INFO',
    message       TEXT           NOT NULL,
    is_acked      TINYINT(1)     NOT NULL DEFAULT 0,
    acked_by      INT UNSIGNED   NULL,
    acked_at      TIMESTAMP      NULL,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_alerts     PRIMARY KEY (alert_id),
    CONSTRAINT fk_alert_zone FOREIGN KEY (zone_id)  REFERENCES coastal_zones(zone_id)
        ON DELETE SET NULL  ON UPDATE CASCADE,
    CONSTRAINT fk_alert_ack  FOREIGN KEY (acked_by) REFERENCES users(user_id)
        ON DELETE SET NULL  ON UPDATE CASCADE,
    INDEX idx_alert_unacked (is_acked),
    INDEX idx_alert_zone    (zone_id),
    INDEX idx_alert_type    (alert_type)
) ENGINE=InnoDB COMMENT='System alerts — critical retreats, zone reclassifications, blocked permits';

-- ─────────────────────────────────────────────
-- TABLE: audit_log  (INSERT ONLY — immutable)
-- Anti-fraud: all critical changes tracked
-- ─────────────────────────────────────────────
CREATE TABLE audit_log (
    log_id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    table_name    VARCHAR(80)     NOT NULL,
    operation     ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    record_id     INT UNSIGNED    NOT NULL,
    field_changed VARCHAR(80)     NULL,
    old_value     TEXT            NULL,
    new_value     TEXT            NULL,
    user_id       INT UNSIGNED    NULL,
    ip_address    VARCHAR(45)     NULL COMMENT 'IPv4 or IPv6',
    logged_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_audit_log PRIMARY KEY (log_id),
    INDEX idx_al_table  (table_name),
    INDEX idx_al_record (record_id),
    INDEX idx_al_user   (user_id),
    INDEX idx_al_date   (logged_at)
) ENGINE=InnoDB COMMENT='Immutable audit log — INSERT ONLY, anti-fraud traceability';
