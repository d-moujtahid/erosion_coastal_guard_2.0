// models/segmentModel.js
// ✅ Utilise les vrais noms de tables du schema.sql :
//    coastal_zones, retreat_measurements, coastline_points, coastline_history
// ✅ Toutes les requêtes utilisent des Parameterized Queries (?)
const pool = require("../config/database");

// ─────────────────────────────────────────────
// Récupère toutes les zones côtières avec filtres optionnels
// Correspond à GET /api/segments
// ─────────────────────────────────────────────
const getAllSegments = async (filters = {}) => {
  let query = `
    SELECT
      z.zone_id        AS id_segment,
      z.zone_name      AS nom_segment,
      z.location       AS zone_geographique,
      z.latitude_center  AS latitude_debut,
      z.longitude_center AS longitude_debut,
      z.status,
      CASE z.status
        WHEN 'RED'    THEN 'critique'
        WHEN 'ORANGE' THEN 'modere'
        WHEN 'GREEN'  THEN 'stable'
      END AS statut_erosion,
      z.area_km2,
      z.updated_at,
      COUNT(cp.point_id) AS nb_mesures,
      MAX(rm.annual_retreat_m) AS taux_recul_annuel,
      MAX(rm.total_distance_m) AS recul_total_m
    FROM coastal_zones z
    LEFT JOIN coastline_points  cp ON cp.zone_id = z.zone_id
    LEFT JOIN (
      SELECT zone_id, MAX(measure_id) AS latest_measure_id
      FROM retreat_measurements
      GROUP BY zone_id
    ) rm_latest ON rm_latest.zone_id = z.zone_id
    LEFT JOIN retreat_measurements rm
      ON rm.measure_id = rm_latest.latest_measure_id
  `;

  const params = [];
  const where = [];

  // Filtre par zone géographique (ex: ?zone=Taghazout)
  if (filters.zone) {
    where.push("z.location = ?");
    params.push(filters.zone);
  }

  // Filtre par statut (ex: ?statut=critique)
  // On accepte les deux formats : 'critique' OU 'RED'
  if (filters.statut) {
    const statusMap = { critique: "RED", modere: "ORANGE", stable: "GREEN" };
    const dbStatus = statusMap[filters.statut] || filters.statut.toUpperCase();
    where.push("z.status = ?");
    params.push(dbStatus);
  }

  if (where.length) query += " WHERE " + where.join(" AND ");

  query += " GROUP BY z.zone_id ORDER BY z.status ASC, z.zone_name ASC";

  const [rows] = await pool.execute(query, params);
  return rows;
};

// ─────────────────────────────────────────────
// Récupère une zone par son ID
// Correspond à GET /api/segments/:id
// ─────────────────────────────────────────────
const getSegmentById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT
       z.zone_id        AS id_segment,
       z.zone_name      AS nom_segment,
       z.location       AS zone_geographique,
       z.latitude_center,
       z.longitude_center,
       z.status,
       CASE z.status
         WHEN 'RED'    THEN 'critique'
         WHEN 'ORANGE' THEN 'modere'
         WHEN 'GREEN'  THEN 'stable'
       END AS statut_erosion,
       z.area_km2,
       z.description,
       z.updated_at
     FROM coastal_zones z
     WHERE z.zone_id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0] || null;
};

// ─────────────────────────────────────────────
// Crée une nouvelle zone côtière
// Correspond à POST /api/segments
// ─────────────────────────────────────────────
const createSegment = async (data, userId = null) => {
  const {
    nom_segment,
    zone_geographique,
    latitude_debut,
    longitude_debut,
    area_km2,
    statut_erosion,
    description,
  } = data;

  // Convertir le statut français → format DB anglais
  const statusMap = { critique: "RED", modere: "ORANGE", stable: "GREEN" };
  const dbStatus = statusMap[statut_erosion] || "GREEN";

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO coastal_zones
         (zone_name, location, latitude_center, longitude_center, status, area_km2, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nom_segment,
        zone_geographique,
        latitude_debut,
        longitude_debut,
        dbStatus,
        area_km2 || null,
        description || null,
      ],
    );

    const zoneId = result.insertId;

    const [pointResult] = await conn.execute(
      `INSERT INTO coastline_points
         (zone_id, sensor_id, latitude, longitude, altitude_m, precision_m,
          acquisition_method, measured_by, measurement_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
      [
        zoneId,
        null,
        latitude_debut,
        longitude_debut,
        null,
        null,
        "ZONE_CREATE",
        userId,
        `Auto-created current point from zone creation #${zoneId}`,
      ],
    );

    await conn.commit();

    return {
      id_segment: zoneId,
      id_point: pointResult.insertId,
      nom_segment,
      zone_geographique,
      statut_erosion,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ─────────────────────────────────────────────
// Met à jour une zone côtière (admin)
// Correspond à PUT /api/segments/:id
// ─────────────────────────────────────────────
const updateSegment = async (id, data) => {
  const allowed = {
    nom_segment: "zone_name",
    zone_geographique: "location",
    latitude_debut: "latitude_center",
    longitude_debut: "longitude_center",
    area_km2: "area_km2",
    description: "description",
    statut_erosion: "status",
  };

  const sets = [];
  const params = [];

  Object.keys(allowed).forEach((k) => {
    if (!(k in data)) return;
    if (k === "statut_erosion") {
      const statusMap = { critique: "RED", modere: "ORANGE", stable: "GREEN" };
      const dbStatus =
        statusMap[data[k]] || String(data[k] || "").toUpperCase();
      if (!["RED", "ORANGE", "GREEN"].includes(dbStatus)) return;
      sets.push(`${allowed[k]} = ?`);
      params.push(dbStatus);
      return;
    }
    sets.push(`${allowed[k]} = ?`);
    params.push(data[k]);
  });

  if (!sets.length) return false;

  params.push(id);
  const [result] = await pool.execute(
    `UPDATE coastal_zones
     SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP
     WHERE zone_id = ?`,
    params,
  );

  return result.affectedRows > 0;
};

// ─────────────────────────────────────────────
// Supprime une zone côtière (admin)
// Correspond à DELETE /api/segments/:id
// ─────────────────────────────────────────────
const deleteSegment = async (id) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const dependencyTables = [
      "alerts",
      "construction_permits",
      "retreat_measurements",
      "coastline_points",
      "coastline_history",
      "gps_sensors",
    ];

    for (const tableName of dependencyTables) {
      try {
        await conn.execute(`DELETE FROM ${tableName} WHERE zone_id = ?`, [id]);
      } catch (err) {
        if (
          err &&
          (err.code === "ER_NO_SUCH_TABLE" || err.code === "ER_BAD_FIELD_ERROR")
        ) {
          continue;
        }
        throw err;
      }
    }

    const [result] = await conn.execute(
      `DELETE FROM coastal_zones WHERE zone_id = ?`,
      [id],
    );

    await conn.commit();
    return result.affectedRows > 0;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ─────────────────────────────────────────────
// Calcul du recul côtier 2016 → 2026 (Haversine)
// D'abord cherche dans retreat_measurements (données pré-calculées)
// Sinon calcule à la volée depuis coastline_history + coastline_points
// Correspond à GET /api/segments/:id/recul
// ─────────────────────────────────────────────
const getReculHaversine = async (id_zone) => {
  // Étape 1 — Chercher dans les mesures de recul déjà calculées
  const [existing] = await pool.execute(
    `SELECT
       rm.zone_id       AS id_segment,
       z.zone_name      AS nom_segment,
       rm.lat_2016, rm.lon_2016,
       rm.lat_2026, rm.lon_2026,
       rm.total_distance_m  AS recul_m,
       rm.annual_retreat_m  AS taux_annuel,
       rm.years_difference  AS periode_ans,
       rm.computed_at
     FROM retreat_measurements rm
     JOIN coastal_zones z ON z.zone_id = rm.zone_id
     WHERE rm.zone_id = ?
     ORDER BY rm.computed_at DESC
     LIMIT 1`,
    [id_zone],
  );

  if (existing.length) return existing[0];

  // Étape 2 — Calculer à la volée si pas encore en base
  // En utilisant la procédure stockée calculate_retreat du schema
  const [calcRows] = await pool.execute(
    `SELECT
       ch.latitude  AS lat_2016, ch.longitude  AS lon_2016,
       cp.latitude  AS lat_2026, cp.longitude  AS lon_2026,
       ROUND(6371000 * ACOS(LEAST(1.0,
         COS(RADIANS(ch.latitude)) * COS(RADIANS(cp.latitude)) *
         COS(RADIANS(cp.longitude) - RADIANS(ch.longitude)) +
         SIN(RADIANS(ch.latitude)) * SIN(RADIANS(cp.latitude))
       )), 2) AS recul_m
     FROM coastline_history ch
     JOIN coastline_points cp ON cp.zone_id = ch.zone_id
     WHERE ch.zone_id = ?
       AND ch.reference_year = 2016
     ORDER BY recul_m DESC
     LIMIT 1`,
    [id_zone],
  );

  if (!calcRows.length) return null;

  const r = calcRows[0];
  return {
    id_segment: id_zone,
    recul_m: r.recul_m,
    taux_annuel: +(r.recul_m / 10).toFixed(2),
    periode_ans: 10,
    lat_2016: r.lat_2016,
    lon_2016: r.lon_2016,
    lat_2026: r.lat_2026,
    lon_2026: r.lon_2026,
  };
};

module.exports = {
  getAllSegments,
  getSegmentById,
  createSegment,
  updateSegment,
  deleteSegment,
  getReculHaversine,
};
