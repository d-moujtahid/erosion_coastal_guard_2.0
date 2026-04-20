const pool = require("../config/database");

const getAllSensors = async (filters = {}) => {
  let query = `
    SELECT
      gs.sensor_id,
      gs.zone_id,
      z.zone_name AS zone_name,
      gs.sensor_code,
      gs.sensor_type,
      gs.latitude_install,
      gs.longitude_install,
      gs.precision_m,
      gs.status,
      gs.install_date,
      gs.last_calibration
    FROM gps_sensors gs
    JOIN coastal_zones z ON z.zone_id = gs.zone_id
  `;

  const where = [];
  const params = [];

  if (filters.zone_id) {
    where.push("gs.zone_id = ?");
    params.push(Number(filters.zone_id));
  }

  if (filters.status) {
    where.push("gs.status = ?");
    params.push(String(filters.status).toUpperCase());
  }

  if (filters.code) {
    where.push("gs.sensor_code LIKE ?");
    params.push(`%${String(filters.code)}%`);
  }

  if (where.length) query += ` WHERE ${where.join(" AND ")}`;
  query += " ORDER BY gs.install_date DESC, gs.sensor_id DESC";

  const [rows] = await pool.execute(query, params);
  return rows;
};

const getSensorById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT
       gs.sensor_id,
       gs.zone_id,
       z.zone_name AS zone_name,
       gs.sensor_code,
       gs.sensor_type,
       gs.latitude_install,
       gs.longitude_install,
       gs.precision_m,
       gs.status,
       gs.install_date,
       gs.last_calibration
     FROM gps_sensors gs
     JOIN coastal_zones z ON z.zone_id = gs.zone_id
     WHERE gs.sensor_id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0] || null;
};

const createSensor = async (data) => {
  const {
    zone_id,
    sensor_code,
    sensor_type,
    latitude_install,
    longitude_install,
    precision_m,
    status,
    install_date,
    last_calibration,
  } = data;

  const [result] = await pool.execute(
    `INSERT INTO gps_sensors
       (zone_id, sensor_code, sensor_type, latitude_install, longitude_install,
        precision_m, status, install_date, last_calibration)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      zone_id,
      sensor_code,
      sensor_type || null,
      latitude_install,
      longitude_install,
      precision_m || null,
      status || "ACTIVE",
      install_date,
      last_calibration || null,
    ],
  );

  return { sensor_id: result.insertId, zone_id, sensor_code };
};

const updateSensor = async (id, data) => {
  const allowed = {
    zone_id: "zone_id",
    sensor_code: "sensor_code",
    sensor_type: "sensor_type",
    latitude_install: "latitude_install",
    longitude_install: "longitude_install",
    precision_m: "precision_m",
    status: "status",
    install_date: "install_date",
    last_calibration: "last_calibration",
  };

  const sets = [];
  const params = [];

  Object.keys(allowed).forEach((k) => {
    if (!(k in data)) return;
    sets.push(`${allowed[k]} = ?`);
    params.push(data[k]);
  });

  if (!sets.length) return false;

  params.push(id);
  const [result] = await pool.execute(
    `UPDATE gps_sensors
     SET ${sets.join(", ")}
     WHERE sensor_id = ?`,
    params,
  );

  return result.affectedRows > 0;
};

const deleteSensor = async (id) => {
  const [result] = await pool.execute(
    `DELETE FROM gps_sensors WHERE sensor_id = ?`,
    [id],
  );
  return result.affectedRows > 0;
};

module.exports = {
  getAllSensors,
  getSensorById,
  createSensor,
  updateSensor,
  deleteSensor,
};
