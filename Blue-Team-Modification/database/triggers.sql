-- ============================================================
-- PROJECT   : Erosion-Coastal Guard
-- FILE      : erosion_procedures_triggers.sql
-- PHASE     : 4 & 5 — Business Logic + Minimal Security
-- COMPARISON: 2016 baseline → 2026 current (10-year retreat)
-- REQUIRES  : erosion_coastal_schema.sql executed first
-- ============================================================

USE erosion_coastal_guard;

DELIMITER $$

-- ============================================================
-- PROCEDURE 1 : calculate_retreat
-- Haversine formula — computes retreat between 2016 and 2026
--
-- Haversine Formula:
--   Δlat = lat2 - lat1 (in radians)
--   Δlon = lon2 - lon1 (in radians)
--   a    = sin²(Δlat/2) + cos(lat1) · cos(lat2) · sin²(Δlon/2)
--   c    = 2 · atan2(√a, √(1−a))
--   d    = R · c          R = 6 371 000 m (Earth mean radius)
-- ============================================================
CREATE PROCEDURE calculate_retreat(
    -- 2016 position (historic baseline)
    IN  p_lat_2016      DECIMAL(10,7),
    IN  p_lon_2016      DECIMAL(10,7),
    -- 2026 position (current survey)
    IN  p_lat_2026      DECIMAL(10,7),
    IN  p_lon_2026      DECIMAL(10,7),
    -- Time span (default 10 years: 2016 → 2026)
    IN  p_years         DECIMAL(5,2),
    OUT p_total_m       DECIMAL(12,4),   -- Total retreat in meters
    OUT p_annual_m      DECIMAL(10,4)    -- Annual retreat in m/year
)
COMMENT 'Haversine: total retreat (m) and annual rate (m/yr) between 2016 and 2026'
BEGIN
    DECLARE v_R         DOUBLE DEFAULT 6371000.0;  -- Earth radius (meters)
    DECLARE v_dlat      DOUBLE;
    DECLARE v_dlon      DOUBLE;
    DECLARE v_a         DOUBLE;
    DECLARE v_c         DOUBLE;
    DECLARE v_dist_m    DOUBLE;

    -- ── Input validation ──────────────────────────────────────
    IF p_years IS NULL OR p_years <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'years_difference must be > 0 (default: 10 for 2016→2026)';
    END IF;

    -- ── Step 1 : Convert coordinates to radians ───────────────
    SET v_dlat = RADIANS(p_lat_2026 - p_lat_2016);
    SET v_dlon = RADIANS(p_lon_2026 - p_lon_2016);

    -- ── Step 2 : Haversine intermediate term 'a' ─────────────
    -- a = sin²(Δlat/2) + cos(lat₂₀₁₆) · cos(lat₂₀₂₆) · sin²(Δlon/2)
    SET v_a = POW(SIN(v_dlat / 2.0), 2)
            + COS(RADIANS(p_lat_2016))
            * COS(RADIANS(p_lat_2026))
            * POW(SIN(v_dlon / 2.0), 2);

    -- ── Step 3 : Angular distance 'c' ────────────────────────
    -- c = 2 · atan2(√a, √(1−a))
    SET v_c = 2.0 * ATAN2(SQRT(v_a), SQRT(1.0 - v_a));

    -- ── Step 4 : Distance in meters ──────────────────────────
    SET v_dist_m = v_R * v_c;

    -- ── Step 5 : Output ───────────────────────────────────────
    SET p_total_m  = ROUND(v_dist_m,         4);
    SET p_annual_m = ROUND(v_dist_m / p_years, 4);
END$$


-- ============================================================
-- PROCEDURE 2 : classify_coastal_zone
-- Classifies zone based on annual retreat rate.
-- Updates status and writes to audit_log.
-- Generates alert if reclassified to RED.
--
-- Rules (harmonised with MCD):
--   annual_retreat > 2.0 m/yr   → RED    (critical)
--   1.0 ≤ annual_retreat ≤ 2.0  → ORANGE (warning)
--   annual_retreat < 1.0        → GREEN  (stable)
-- ============================================================
CREATE PROCEDURE classify_coastal_zone(
    IN  p_zone_id        INT UNSIGNED,
    IN  p_annual_retreat DECIMAL(10,4),
    IN  p_user_id        INT UNSIGNED,
    OUT p_new_status     VARCHAR(10)
)
COMMENT 'Classifies zone GREEN/ORANGE/RED, updates status, writes audit + alert'
BEGIN
    DECLARE v_old_status VARCHAR(10);
    DECLARE v_new_status ENUM('GREEN','ORANGE','RED');

    -- ── Fetch current status with row lock ────────────────────
    SELECT status INTO v_old_status
    FROM   coastal_zones
    WHERE  zone_id = p_zone_id
    LIMIT  1 FOR UPDATE;

    IF v_old_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Zone not found — cannot classify';
    END IF;

    -- ── Apply classification rules ────────────────────────────
    IF p_annual_retreat > 2.0 THEN
        SET v_new_status = 'RED';
    ELSEIF p_annual_retreat >= 1.0 THEN
        SET v_new_status = 'ORANGE';
    ELSE
        SET v_new_status = 'GREEN';
    END IF;

    -- ── Update zone status ────────────────────────────────────
    UPDATE coastal_zones
    SET    status     = v_new_status,
           updated_at = CURRENT_TIMESTAMP
    WHERE  zone_id    = p_zone_id;

    -- ── Write audit log entry ─────────────────────────────────
    INSERT INTO audit_log (
        table_name, operation, record_id,
        field_changed, old_value, new_value, user_id
    ) VALUES (
        'coastal_zones', 'UPDATE', p_zone_id,
        'status', v_old_status, v_new_status, p_user_id
    );

    -- ── Generate alert if newly RED ───────────────────────────
    IF v_new_status = 'RED' AND v_old_status <> 'RED' THEN
        INSERT INTO alerts (zone_id, alert_type, urgency_level, message)
        VALUES (
            p_zone_id,
            'ZONE_RED_NEW',
            'CRITICAL',
            CONCAT('Zone id=', p_zone_id,
                   ' reclassified RED — annual retreat: ',
                   p_annual_retreat, ' m/yr (2016→2026 analysis)')
        );
    END IF;

    SET p_new_status = v_new_status;
END$$


-- ============================================================
-- PROCEDURE 3 : compute_and_store_retreat
-- Full pipeline:
--   1. Haversine (2016 → 2026)
--   2. Store in retreat_measurements
--   3. Classify zone
--   4. Return summary
-- ============================================================
CREATE PROCEDURE compute_and_store_retreat(
    IN p_zone_id     INT UNSIGNED,
    IN p_lat_2016    DECIMAL(10,7),
    IN p_lon_2016    DECIMAL(10,7),
    IN p_lat_2026    DECIMAL(10,7),
    IN p_lon_2026    DECIMAL(10,7),
    IN p_user_id     INT UNSIGNED
)
COMMENT 'End-to-end: Haversine(2016→2026) → persist → classify → return summary'
BEGIN
    DECLARE v_total_m   DECIMAL(12,4);
    DECLARE v_annual_m  DECIMAL(10,4);
    DECLARE v_status    VARCHAR(10);

    -- Step 1 : Compute retreat over 10 years
    CALL calculate_retreat(
        p_lat_2016, p_lon_2016,
        p_lat_2026, p_lon_2026,
        10.0,                      -- 2016 → 2026 = exactly 10 years
        v_total_m, v_annual_m
    );

    -- Step 2 : Persist measurement
    INSERT INTO retreat_measurements (
        zone_id,
        lat_2016, lon_2016,
        lat_2026, lon_2026,
        years_difference,
        total_distance_m, annual_retreat_m,
        computed_by
    ) VALUES (
        p_zone_id,
        p_lat_2016, p_lon_2016,
        p_lat_2026, p_lon_2026,
        10.00,
        v_total_m, v_annual_m,
        p_user_id
    );

    -- Step 3 : Classify zone
    CALL classify_coastal_zone(p_zone_id, v_annual_m, p_user_id, v_status);

    -- Step 4 : Return summary
    SELECT
        p_zone_id        AS zone_id,
        v_total_m        AS total_retreat_meters,
        v_annual_m       AS annual_retreat_m_per_year,
        v_status         AS zone_classification,
        '2016→2026'      AS comparison_period;
END$$


-- ============================================================
-- TRIGGER 1 : trg_block_red_zone_permit
-- BEFORE INSERT on construction_permits
-- Blocks any permit in a RED zone automatically.
-- Sets status = 'AUTO_BLOCKED' and raises error.
-- ============================================================
CREATE TRIGGER trg_block_red_zone_permit
BEFORE INSERT ON construction_permits
FOR EACH ROW
BEGIN
    DECLARE v_zone_status VARCHAR(10);

    -- Read current zone classification
    SELECT status INTO v_zone_status
    FROM   coastal_zones
    WHERE  zone_id = NEW.zone_id
    LIMIT  1;

    -- Zone not found → block by security default
    IF v_zone_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Zone not found — permit insertion blocked by default';
    END IF;

    -- Zone RED → auto-block permit
    IF v_zone_status = 'RED' THEN
        SET NEW.status           = 'AUTO_BLOCKED';
        SET NEW.rejection_reason = CONCAT(
            'Construction forbidden in RED coastal zone ',
            '(2016→2026 annual retreat > 2m). Zone id=', NEW.zone_id
        );
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Construction forbidden in RED coastal zone';
    END IF;
END$$


-- ============================================================
-- TRIGGER 2 : trg_audit_zone_status
-- AFTER UPDATE on coastal_zones
-- Logs every status change to audit_log (anti-fraud).
-- Captures: zone_id, old_status, new_status, timestamp
-- ============================================================
CREATE TRIGGER trg_audit_zone_status
AFTER UPDATE ON coastal_zones
FOR EACH ROW
BEGIN
    -- Only log when status actually changed
    IF OLD.status <> NEW.status THEN
        INSERT INTO audit_log (
            table_name,
            operation,
            record_id,
            field_changed,
            old_value,
            new_value,
            user_id,
            logged_at
        ) VALUES (
            'coastal_zones',
            'UPDATE',
            OLD.zone_id,
            'status',
            OLD.status,
            NEW.status,
            NULL,                   -- user_id injected by application layer
            CURRENT_TIMESTAMP
        );
    END IF;
END$$


-- ============================================================
-- TRIGGER 3 : trg_audit_permit_insert
-- AFTER INSERT on construction_permits
-- Logs every permit attempt (including AUTO_BLOCKED ones)
-- for full traceability.
-- ============================================================
CREATE TRIGGER trg_audit_permit_insert
AFTER INSERT ON construction_permits
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (
        table_name, operation, record_id,
        field_changed, old_value, new_value,
        user_id, logged_at
    ) VALUES (
        'construction_permits',
        'INSERT',
        NEW.permit_id,
        'status',
        NULL,
        NEW.status,
        NEW.submitted_by,
        CURRENT_TIMESTAMP
    );
END$$


-- ============================================================
-- TRIGGER 4 : trg_alert_on_retreat_insert
-- AFTER INSERT on retreat_measurements
-- Auto-generates CRITICAL alert when annual retreat > 2 m/yr
-- ============================================================
CREATE TRIGGER trg_alert_on_retreat_insert
AFTER INSERT ON retreat_measurements
FOR EACH ROW
BEGIN
    IF NEW.annual_retreat_m > 2.0 THEN
        INSERT INTO alerts (
            zone_id, alert_type, urgency_level, message, created_at
        ) VALUES (
            NEW.zone_id,
            'CRITICAL_RETREAT',
            'CRITICAL',
            CONCAT('CRITICAL — Zone id=', NEW.zone_id,
                   ' annual retreat=', NEW.annual_retreat_m,
                   ' m/yr (2016→2026). Immediate action required.'),
            CURRENT_TIMESTAMP
        );
    ELSEIF NEW.annual_retreat_m >= 1.0 THEN
        INSERT INTO alerts (
            zone_id, alert_type, urgency_level, message, created_at
        ) VALUES (
            NEW.zone_id,
            'CRITICAL_RETREAT',
            'WARNING',
            CONCAT('WARNING — Zone id=', NEW.zone_id,
                   ' annual retreat=', NEW.annual_retreat_m,
                   ' m/yr (2016→2026). Monitor closely.'),
            CURRENT_TIMESTAMP
        );
    END IF;
END$$


DELIMITER ;

-- ============================================================
-- QA USAGE EXAMPLES — Phase 7
-- ============================================================
-- Test 1: ~200m retreat over 10 years → 20 m/yr → RED
-- CALL calculate_retreat(
--   30.4200000, -9.5980000,   -- position 2016 (Agadir)
--   30.4218000, -9.5980000,   -- position 2026 (~200m north)
--   10,
--   @total, @annual
-- );
-- SELECT @total AS total_m, @annual AS m_per_year;
-- Expected: @total ≈ 200m, @annual ≈ 20 m/yr → RED classification
--
-- Test 2: Agadir → Taghazout full distance (~18.5 km)
-- CALL calculate_retreat(
--   30.4200, -9.6050,   -- Agadir Centre
--   30.5440, -9.7080,   -- Taghazout Nord
--   10,
--   @total, @annual
-- );
-- Expected: @total ≈ 18500m, @annual ≈ 1850 m/yr
-- ============================================================
-- END OF FILE — Phases 4 & 5
-- ============================================================