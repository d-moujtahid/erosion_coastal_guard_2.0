// models/mesureModel.js
// ✅ Utilise les tables du schema.sql : coastline_points (mesures 2026)
//    et coastline_history (mesures historiques 2016)
const pool = require("../config/database");

// ─────────────────────────────────────────────
// Toutes les mesures GPS d'une zone (points actuels 2026)
// Correspond à GET /api/mesures/:id_zone
// ─────────────────────────────────────────────
const getMesuresByZone = async (id_zone) => {
  const [rows] = await pool.execute(
    `SELECT
       cp.point_id        AS id_mesure,
       cp.zone_id         AS id_segment,
       cp.sensor_id,
       z.zone_name        AS nom_segment,
       cp.latitude,
       cp.longitude,
       cp.altitude_m,
       cp.precision_m,
       cp.acquisition_method AS methode,
       cp.measurement_date   AS date_mesure,
       rm.total_distance_m   AS haversine_m,
       u.username         AS operateur,
       cp.notes
     FROM coastline_points cp
     JOIN coastal_zones z ON z.zone_id = cp.zone_id
     LEFT JOIN (
       SELECT zone_id, MAX(measure_id) AS latest_measure_id
       FROM retreat_measurements
       GROUP BY zone_id
     ) rm_latest ON rm_latest.zone_id = cp.zone_id
     LEFT JOIN retreat_measurements rm
       ON rm.measure_id = rm_latest.latest_measure_id
     LEFT JOIN users u ON u.user_id = cp.measured_by
     WHERE cp.zone_id = ? AND cp.is_valid = 1
     ORDER BY cp.measurement_date DESC`,
    [id_zone],
  );
  return rows;
};

// ─────────────────────────────────────────────
// Toutes les mesures GPS (toutes zones confondues)
// Correspond à GET /api/mesures
// ─────────────────────────────────────────────
const getAllMesures = async (limit = 50) => {
  const [rows] = await pool.execute(
    `SELECT
       cp.point_id           AS id_mesure,
       cp.zone_id            AS id_segment,
       cp.sensor_id,
       z.zone_name           AS nom_segment,
       cp.latitude,
       cp.longitude,
       cp.measurement_date   AS date_mesure,
       rm.total_distance_m   AS haversine_m,
       u.username            AS operateur
     FROM coastline_points cp
     JOIN (
       SELECT cp1.zone_id, MAX(cp1.point_id) AS latest_point_id
       FROM coastline_points cp1
       JOIN (
         SELECT zone_id, MAX(measurement_date) AS latest_date
         FROM coastline_points
         WHERE is_valid = 1
         GROUP BY zone_id
       ) latest_date
         ON latest_date.zone_id = cp1.zone_id
        AND latest_date.latest_date = cp1.measurement_date
       WHERE cp1.is_valid = 1
       GROUP BY cp1.zone_id
     ) latest_cp ON latest_cp.latest_point_id = cp.point_id
     JOIN coastal_zones z ON z.zone_id = cp.zone_id
     LEFT JOIN (
       SELECT zone_id, MAX(measure_id) AS latest_measure_id
       FROM retreat_measurements
       GROUP BY zone_id
     ) rm_latest ON rm_latest.zone_id = cp.zone_id
     LEFT JOIN retreat_measurements rm
       ON rm.measure_id = rm_latest.latest_measure_id
     LEFT JOIN users u ON u.user_id = cp.measured_by
     WHERE cp.is_valid = 1
     ORDER BY cp.measurement_date DESC
     LIMIT ?`,
    [limit],
  );
  return rows;
};

// ─────────────────────────────────────────────
// Ajouter une nouvelle mesure GPS terrain
// Correspond à POST /api/mesures
// ─────────────────────────────────────────────
const createMesure = async (data, userId) => {
  const {
    id_zone,
    sensor_id,
    latitude,
    longitude,
    altitude_m,
    precision_m,
    methode,
    date_mesure,
    notes,
  } = data;

  const [result] = await pool.execute(
    `INSERT INTO coastline_points
       (zone_id, sensor_id, latitude, longitude, altitude_m, precision_m,
        acquisition_method, measured_by, measurement_date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id_zone,
      sensor_id || null,
      latitude,
      longitude,
      altitude_m || 0,
      precision_m || null,
      methode || "GPS_terrain",
      userId || null,
      date_mesure || new Date().toISOString().split("T")[0],
      notes || null,
    ],
  );

  return { id_mesure: result.insertId, id_zone, latitude, longitude };
};

// ─────────────────────────────────────────────
// Mise à jour d'une mesure GPS terrain existante
// Correspond à PUT /api/mesures/points/:id_mesure
// ─────────────────────────────────────────────
const updateMesure = async (id_mesure, data) => {
  const allowed = {
    sensor_id: "sensor_id",
    latitude: "latitude",
    longitude: "longitude",
    altitude_m: "altitude_m",
    precision_m: "precision_m",
    methode: "acquisition_method",
    date_mesure: "measurement_date",
    notes: "notes",
    is_valid: "is_valid",
  };

  const sets = [];
  const params = [];

  Object.keys(allowed).forEach((k) => {
    if (!(k in data)) return;
    sets.push(`${allowed[k]} = ?`);
    params.push(data[k]);
  });

  if (!sets.length) return false;

  params.push(id_mesure);
  const [result] = await pool.execute(
    `UPDATE coastline_points
     SET ${sets.join(", ")}
     WHERE point_id = ?`,
    params,
  );

  return result.affectedRows > 0;
};

// ─────────────────────────────────────────────
// Détail d'une mesure GPS terrain
// ─────────────────────────────────────────────
const getMesureById = async (id_mesure) => {
  const [rows] = await pool.execute(
    `SELECT
       cp.point_id AS id_mesure,
       cp.zone_id AS id_segment,
       cp.sensor_id,
       cp.latitude,
       cp.longitude,
       cp.altitude_m,
       cp.precision_m,
       cp.acquisition_method AS methode,
       cp.measurement_date AS date_mesure,
       cp.is_valid,
       cp.notes
     FROM coastline_points cp
     WHERE cp.point_id = ?
     LIMIT 1`,
    [id_mesure],
  );
  return rows[0] || null;
};

// ─────────────────────────────────────────────
// Historique côtier (baseline/historique) d'une zone
// Correspond à GET /api/mesures/:id_zone/historique
// ─────────────────────────────────────────────
const getHistoriqueByZone = async (id_zone) => {
  const [rows] = await pool.execute(
    `SELECT
       ch.history_id AS id_historique,
       ch.zone_id AS id_segment,
       z.zone_name AS nom_segment,
       ch.reference_year,
       ch.latitude,
       ch.longitude,
       ch.altitude_m,
       ch.source,
       ch.resolution_m,
       u.username AS operateur,
       ch.created_at
     FROM coastline_history ch
     JOIN coastal_zones z ON z.zone_id = ch.zone_id
     LEFT JOIN users u ON u.user_id = ch.recorded_by
     WHERE ch.zone_id = ?
     ORDER BY ch.reference_year DESC, ch.created_at DESC`,
    [id_zone],
  );
  return rows;
};

const upsertCurrentPointFromHistorique = async (
  conn,
  { zoneId, latitude, longitude, altitudeM, resolutionM, userId, historyId },
) => {
  const [[existingPoint]] = await conn.execute(
    `SELECT point_id
     FROM coastline_points
     WHERE zone_id = ? AND is_valid = 1
     ORDER BY measurement_date DESC, created_at DESC, point_id DESC
     LIMIT 1`,
    [zoneId],
  );

  const note = `Synced from history #${historyId}`;

  if (existingPoint?.point_id) {
    await conn.execute(
      `UPDATE coastline_points
       SET latitude = ?,
           longitude = ?,
           altitude_m = ?,
           precision_m = ?,
           acquisition_method = ?,
           measured_by = ?,
           measurement_date = CURDATE(),
           notes = ?
       WHERE point_id = ?`,
      [
        latitude,
        longitude,
        altitudeM || null,
        resolutionM || null,
        "AUTO_FROM_HISTORY",
        userId || null,
        note,
        existingPoint.point_id,
      ],
    );
    return { action: "updated", point_id: existingPoint.point_id };
  }

  const [insertResult] = await conn.execute(
    `INSERT INTO coastline_points
       (zone_id, sensor_id, latitude, longitude, altitude_m, precision_m,
        acquisition_method, measured_by, measurement_date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
    [
      zoneId,
      null,
      latitude,
      longitude,
      altitudeM || null,
      resolutionM || null,
      "AUTO_FROM_HISTORY",
      userId || null,
      note,
    ],
  );

  return { action: "created", point_id: insertResult.insertId };
};

// ─────────────────────────────────────────────
// Ajouter une entrée historique pour une zone
// Correspond à POST /api/mesures/historique
// ─────────────────────────────────────────────
const createHistorique = async (data, userId) => {
  const {
    id_zone,
    reference_year,
    latitude,
    longitude,
    altitude_m,
    source,
    resolution_m,
    geom_wkt,
  } = data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO coastline_history
         (zone_id, latitude, longitude, altitude_m, reference_year,
          geom_wkt, source, resolution_m, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_zone,
        latitude,
        longitude,
        altitude_m || null,
        reference_year,
        geom_wkt || null,
        source || null,
        resolution_m || null,
        userId || null,
      ],
    );

    const pointSync = await upsertCurrentPointFromHistorique(conn, {
      zoneId: id_zone,
      latitude,
      longitude,
      altitudeM: altitude_m,
      resolutionM: resolution_m,
      userId,
      historyId: result.insertId,
    });

    await conn.commit();

    return {
      id_historique: result.insertId,
      id_zone,
      reference_year,
      point_sync_action: pointSync.action,
      auto_point_id: pointSync.point_id,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ─────────────────────────────────────────────
// Mise à jour d'une entrée historique
// Correspond à PUT /api/mesures/historique/:id_historique
// ─────────────────────────────────────────────
const updateHistorique = async (id_historique, data, userId = null) => {
  const allowed = {
    reference_year: "reference_year",
    latitude: "latitude",
    longitude: "longitude",
    altitude_m: "altitude_m",
    source: "source",
    resolution_m: "resolution_m",
    geom_wkt: "geom_wkt",
  };

  const sets = [];
  const params = [];

  Object.keys(allowed).forEach((k) => {
    if (!(k in data)) return;
    sets.push(`${allowed[k]} = ?`);
    params.push(data[k]);
  });

  if (!sets.length) return false;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[existingHistory]] = await conn.execute(
      `SELECT history_id, zone_id
       FROM coastline_history
       WHERE history_id = ?
       LIMIT 1
       FOR UPDATE`,
      [id_historique],
    );

    if (!existingHistory) {
      await conn.rollback();
      return false;
    }

    params.push(id_historique);
    const [result] = await conn.execute(
      `UPDATE coastline_history
       SET ${sets.join(", ")}
       WHERE history_id = ?`,
      params,
    );

    if (!result.affectedRows) {
      await conn.rollback();
      return false;
    }

    const [[freshHistory]] = await conn.execute(
      `SELECT history_id, zone_id, latitude, longitude, altitude_m, resolution_m
       FROM coastline_history
       WHERE history_id = ?
       LIMIT 1`,
      [id_historique],
    );

    await upsertCurrentPointFromHistorique(conn, {
      zoneId: freshHistory.zone_id,
      latitude: freshHistory.latitude,
      longitude: freshHistory.longitude,
      altitudeM: freshHistory.altitude_m,
      resolutionM: freshHistory.resolution_m,
      userId,
      historyId: id_historique,
    });

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ─────────────────────────────────────────────
// Détail d'une entrée historique
// ─────────────────────────────────────────────
const getHistoriqueById = async (id_historique) => {
  const [rows] = await pool.execute(
    `SELECT
       ch.history_id AS id_historique,
       ch.zone_id AS id_segment,
       ch.reference_year,
       ch.latitude,
       ch.longitude,
       ch.altitude_m,
       ch.source,
       ch.resolution_m,
       ch.geom_wkt,
       ch.created_at
     FROM coastline_history ch
     WHERE ch.history_id = ?
     LIMIT 1`,
    [id_historique],
  );
  return rows[0] || null;
};

const toRad = (deg) => (Number(deg) * Math.PI) / 180;

const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = toRad(Number(lat2) - Number(lat1));
  const dLon = toRad(Number(lon2) - Number(lon1));
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(4));
};

// ─────────────────────────────────────────────
// Recalcule et persiste le recul pour une zone
// baseline = coordonnees de la zone (coastal_zones)
// vs point courant (priorite aux mesures terrain)
// ─────────────────────────────────────────────
const recomputeRetreatMeasurement = async (id_zone, userId = null) => {
  const [[zoneBaseline]] = await pool.execute(
    `SELECT
       z.zone_id,
       z.latitude_center,
       z.longitude_center
     FROM coastal_zones z
     WHERE z.zone_id = ?
     LIMIT 1`,
    [id_zone],
  );

  if (!zoneBaseline) return null;

  const [pointRows] = await pool.execute(
    `SELECT
       cp.point_id,
       cp.measurement_date,
       cp.latitude,
       cp.longitude,
       cp.created_at
     FROM coastline_points cp
     WHERE cp.zone_id = ? AND cp.is_valid = 1
     ORDER BY
       cp.measurement_date DESC,
       cp.created_at DESC,
       cp.point_id DESC
     LIMIT 1`,
    [id_zone],
  );

  const point = pointRows[0] || null;
  if (!point) return null;

  const baselineLat = Number(zoneBaseline.latitude_center);
  const baselineLon = Number(zoneBaseline.longitude_center);
  if (!Number.isFinite(baselineLat) || !Number.isFinite(baselineLon)) {
    return null;
  }

  const totalDistance = haversineMeters(
    baselineLat,
    baselineLon,
    Number(point.latitude),
    Number(point.longitude),
  );

  const yearsDifference = 10;

  const annualRetreat = Number((totalDistance / yearsDifference).toFixed(4));

  const [result] = await pool.execute(
    `INSERT INTO retreat_measurements
       (zone_id, lat_2016, lon_2016, lat_2026, lon_2026,
        years_difference, total_distance_m, annual_retreat_m,
        computed_by, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id_zone,
      baselineLat,
      baselineLon,
      Number(point.latitude),
      Number(point.longitude),
      yearsDifference,
      totalDistance,
      annualRetreat,
      userId || null,
      `AUTO_RECOMPUTE from zone baseline#${id_zone} and point#${point.point_id}`,
    ],
  );

  const nextStatus =
    annualRetreat > 2 ? "RED" : annualRetreat >= 1 ? "ORANGE" : "GREEN";

  await pool.execute(
    `UPDATE coastal_zones
     SET status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE zone_id = ?`,
    [nextStatus, id_zone],
  );

  return {
    measure_id: result.insertId,
    zone_id: Number(id_zone),
    years_difference: yearsDifference,
    total_distance_m: totalDistance,
    annual_retreat_m: annualRetreat,
  };
};

module.exports = {
  getMesuresByZone,
  getAllMesures,
  createMesure,
  updateMesure,
  getMesureById,
  getHistoriqueByZone,
  createHistorique,
  updateHistorique,
  getHistoriqueById,
  recomputeRetreatMeasurement,
};
