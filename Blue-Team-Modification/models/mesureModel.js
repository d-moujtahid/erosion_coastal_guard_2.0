// models/mesureModel.js
// ✅ Utilise les tables du schema.sql : coastline_points (mesures 2026)
//    et coastline_history (mesures historiques 2016)
const pool = require('../config/database');

// ─────────────────────────────────────────────
// Toutes les mesures GPS d'une zone (points actuels 2026)
// Correspond à GET /api/mesures/:id_zone
// ─────────────────────────────────────────────
const getMesuresByZone = async (id_zone) => {
  const [rows] = await pool.execute(
    `SELECT
       cp.point_id        AS id_mesure,
       cp.zone_id         AS id_segment,
       z.zone_name        AS nom_segment,
       cp.latitude,
       cp.longitude,
       cp.altitude_m,
       cp.precision_m,
       cp.acquisition_method AS methode,
       cp.measurement_date   AS date_mesure,
       u.username         AS operateur,
       cp.notes
     FROM coastline_points cp
     JOIN coastal_zones z ON z.zone_id = cp.zone_id
     LEFT JOIN users u ON u.user_id = cp.measured_by
     WHERE cp.zone_id = ? AND cp.is_valid = 1
     ORDER BY cp.measurement_date DESC`,
    [id_zone]
  );
  return rows;
};

// ─────────────────────────────────────────────
// Toutes les mesures GPS (toutes zones confondues)
// Correspond à GET /api/mesures
// ─────────────────────────────────────────────
const getAllMesures = async (limit = 50) => {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 50;

  const [rows] = await pool.execute(
    `SELECT
       cp.point_id           AS id_mesure,
       cp.zone_id            AS id_segment,
       z.zone_name           AS nom_segment,
       cp.latitude,
       cp.longitude,
       cp.measurement_date   AS date_mesure,
       u.username            AS operateur
     FROM coastline_points cp
     JOIN coastal_zones z ON z.zone_id = cp.zone_id
     LEFT JOIN users u ON u.user_id = cp.measured_by
     WHERE cp.is_valid = 1
     ORDER BY cp.measurement_date DESC
     LIMIT ${safeLimit}`
  );
  return rows;
};

// ─────────────────────────────────────────────
// Ajouter une nouvelle mesure GPS terrain
// Correspond à POST /api/mesures
// ─────────────────────────────────────────────
const createMesure = async (data, userId) => {
  const {
    id_zone, latitude, longitude,
    altitude_m, precision_m, methode, date_mesure, notes
  } = data;

  const [result] = await pool.execute(
    `INSERT INTO coastline_points
       (zone_id, latitude, longitude, altitude_m, precision_m,
        acquisition_method, measured_by, measurement_date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id_zone, latitude, longitude,
     altitude_m || 0, precision_m || null,
     methode || 'GPS_terrain', userId || null,
     date_mesure || new Date().toISOString().split('T')[0],
     notes || null]
  );

  return { id_mesure: result.insertId, id_zone, latitude, longitude };
};

module.exports = { getMesuresByZone, getAllMesures, createMesure };
