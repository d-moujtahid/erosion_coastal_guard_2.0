// models/dashboardModel.js — agrégations pour le dashboard (schema.sql)
const pool = require("../config/database");

const getSummary = async () => {
  const [[{ total_segments }]] = await pool.execute(
    "SELECT COUNT(*) AS total_segments FROM coastal_zones",
  );

  const [statusRows] = await pool.execute(
    `SELECT status, COUNT(*) AS cnt FROM coastal_zones GROUP BY status`,
  );
  const byStatus = { RED: 0, ORANGE: 0, GREEN: 0 };
  statusRows.forEach((r) => {
    if (r.status in byStatus) byStatus[r.status] = r.cnt;
  });

  const [[gpsRow]] = await pool.execute(
    `SELECT COUNT(*) AS n FROM coastline_points WHERE is_valid = 1`,
  );

  const [[s]] = await pool.execute(
    `SELECT COUNT(*) AS n FROM gps_sensors WHERE status = 'ACTIVE'`,
  );
  const sensorCount = Number(s.n) || 0;

  const [[permitsAgg]] = await pool.execute(
    `SELECT
       SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
       SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_count,
       SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected_count,
       SUM(CASE WHEN status = 'AUTO_BLOCKED' THEN 1 ELSE 0 END) AS blocked_count,
       COUNT(*) AS total_count
     FROM construction_permits`,
  );

  const [[retreatAgg]] = await pool.execute(
    `SELECT
       AVG(rm.annual_retreat_m) AS avg_annual_m,
       MAX(rm.total_distance_m) AS max_total_m,
       AVG(rm.total_distance_m) AS avg_total_m
     FROM retreat_measurements rm
     JOIN (
       SELECT zone_id, MAX(measure_id) AS latest_measure_id
       FROM retreat_measurements
       GROUP BY zone_id
     ) latest ON latest.latest_measure_id = rm.measure_id`,
  );

  const [topSegments] = await pool.execute(
    `SELECT
       z.zone_name,
       rm.total_distance_m,
       rm.annual_retreat_m,
       z.status
     FROM retreat_measurements rm
     JOIN (
       SELECT zone_id, MAX(measure_id) AS latest_measure_id
       FROM retreat_measurements
       GROUP BY zone_id
     ) latest ON latest.latest_measure_id = rm.measure_id
     JOIN coastal_zones z ON z.zone_id = rm.zone_id
     ORDER BY rm.total_distance_m DESC
     LIMIT 5`,
  );

  const [byYear] = await pool.execute(
    `SELECT YEAR(measurement_date) AS y, COUNT(*) AS cnt
     FROM coastline_points
     WHERE is_valid = 1
     GROUP BY YEAR(measurement_date)
     ORDER BY y ASC`,
  );

  const yearMap = Object.fromEntries(byYear.map((r) => [r.y, r.cnt]));
  const minY = byYear.length
    ? Math.min(...byYear.map((r) => r.y))
    : new Date().getFullYear();
  const maxY = byYear.length
    ? Math.max(...byYear.map((r) => r.y))
    : new Date().getFullYear();
  const yStart = Math.min(2016, minY);
  const yEnd = Math.max(2026, maxY);
  const mesures_labels = [];
  const mesures_counts = [];
  for (let y = yStart; y <= yEnd; y++) {
    mesures_labels.push(String(y));
    mesures_counts.push(yearMap[y] || 0);
  }

  const avgTotal =
    retreatAgg?.avg_total_m != null ? Number(retreatAgg.avg_total_m) : 0;
  const avgAnnual =
    retreatAgg?.avg_annual_m != null ? Number(retreatAgg.avg_annual_m) : 0;
  const maxTotal =
    retreatAgg?.max_total_m != null ? Number(retreatAgg.max_total_m) : 0;

  const evolution_labels = [];
  const evolution_cumulative_m = [];
  for (let i = 0; i <= 10; i++) {
    evolution_labels.push(String(2016 + i));
    evolution_cumulative_m.push(+(avgTotal * (i / 10)).toFixed(2));
  }

  const locations = await pool.execute(
    `SELECT DISTINCT location FROM coastal_zones ORDER BY location`,
  );
  const locationSummary =
    locations[0]
      .map((r) => r.location)
      .filter(Boolean)
      .join(" · ") || "—";

  const [[yearRef]] = await pool.execute(
    `SELECT
       MIN(reference_year) AS min_reference_year,
       MAX(reference_year) AS max_reference_year
     FROM coastline_history`,
  );

  const [[yearCur]] = await pool.execute(
    `SELECT
       MIN(YEAR(measurement_date)) AS min_measure_year,
       MAX(YEAR(measurement_date)) AS max_measure_year
     FROM coastline_points
     WHERE is_valid = 1`,
  );

  const baselineYear = Number(yearRef.min_reference_year) || 2016;
  const currentYear = Number(yearCur.max_measure_year) || 2026;

  const [rolesRows] = await pool.execute(
    `SELECT role_name FROM roles ORDER BY role_name ASC`,
  );

  const [[auditRow]] = await pool.execute(
    `SELECT COUNT(*) AS n FROM audit_log`,
  );

  const [[historySources]] = await pool.execute(
    `SELECT COUNT(DISTINCT source) AS n
     FROM coastline_history
     WHERE source IS NOT NULL AND source <> ''`,
  );

  const [coast2026Rows] = await pool.execute(
    `SELECT
       z.zone_id,
       COALESCE(AVG(cp.latitude), z.latitude_center)  AS lat,
       COALESCE(AVG(cp.longitude), z.longitude_center) AS lon
     FROM coastal_zones z
     LEFT JOIN coastline_points cp
       ON cp.zone_id = z.zone_id
      AND cp.is_valid = 1
      AND cp.measurement_date = (
        SELECT MAX(cp2.measurement_date)
        FROM coastline_points cp2
        WHERE cp2.zone_id = z.zone_id
          AND cp2.is_valid = 1
      )
     GROUP BY z.zone_id, z.latitude_center, z.longitude_center
     ORDER BY z.latitude_center DESC`,
  );

  const [coast2016Rows] = await pool.execute(
    `SELECT
       z.zone_id,
       COALESCE(AVG(ch.latitude), z.latitude_center)  AS lat,
       COALESCE(AVG(ch.longitude), z.longitude_center) AS lon
     FROM coastal_zones z
     LEFT JOIN coastline_history ch
       ON ch.zone_id = z.zone_id
      AND ch.reference_year = ?
     GROUP BY z.zone_id, z.latitude_center, z.longitude_center
     ORDER BY z.latitude_center DESC`,
    [baselineYear],
  );

  return {
    total_segments: Number(total_segments) || 0,
    zones_red: byStatus.RED,
    zones_orange: byStatus.ORANGE,
    zones_green: byStatus.GREEN,
    gps_points_total: Number(gpsRow.n) || 0,
    sensors_active: sensorCount,
    permits_total: Number(permitsAgg.total_count) || 0,
    permits_pending: Number(permitsAgg.pending_count) || 0,
    permits_approved: Number(permitsAgg.approved_count) || 0,
    permits_rejected: Number(permitsAgg.rejected_count) || 0,
    permits_auto_blocked: Number(permitsAgg.blocked_count) || 0,
    avg_annual_retreat_m: avgAnnual,
    avg_total_retreat_m: avgTotal,
    max_total_retreat_m: maxTotal,
    top_segments: topSegments.map((r) => ({
      zone_name: r.zone_name,
      total_distance_m:
        r.total_distance_m != null ? Number(r.total_distance_m) : 0,
      annual_retreat_m:
        r.annual_retreat_m != null ? Number(r.annual_retreat_m) : 0,
      status: r.status,
    })),
    mesures_par_annee: { labels: mesures_labels, counts: mesures_counts },
    evolution: {
      labels: evolution_labels,
      cumulative_m: evolution_cumulative_m,
      avg_annual_m: avgAnnual,
    },
    location_summary: locationSummary,
    monitoring_locations: locations[0].map((r) => r.location).filter(Boolean),
    role_names: rolesRows.map((r) => r.role_name),
    audit_log_entries: Number(auditRow.n) || 0,
    history_sources_count: Number(historySources.n) || 0,
    reference_period: {
      baseline_year: baselineYear,
      current_year: currentYear,
    },
    coastline_2016: coast2016Rows.map((r) => ({
      zone_id: r.zone_id,
      lat: Number(r.lat),
      lon: Number(r.lon),
    })),
    coastline_2026: coast2026Rows.map((r) => ({
      zone_id: r.zone_id,
      lat: Number(r.lat),
      lon: Number(r.lon),
    })),
  };
};

module.exports = { getSummary };
