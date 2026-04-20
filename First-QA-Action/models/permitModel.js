const pool = require("../config/database");

const getAllPermits = async (filters = {}) => {
  let query = `
    SELECT
      cp.permit_id,
      cp.zone_id,
      z.zone_name,
      cp.applicant_name,
      cp.project_title,
      cp.project_type,
      cp.surface_m2,
      cp.coord_lat,
      cp.coord_lon,
      cp.status,
      cp.rejection_reason,
      cp.submitted_by,
      u_submit.username AS submitted_by_username,
      cp.submitted_at,
      cp.reviewed_by,
      u_review.username AS reviewed_by_username,
      cp.reviewed_at
    FROM construction_permits cp
    JOIN coastal_zones z ON z.zone_id = cp.zone_id
    LEFT JOIN users u_submit ON u_submit.user_id = cp.submitted_by
    LEFT JOIN users u_review ON u_review.user_id = cp.reviewed_by
  `;

  const where = [];
  const params = [];

  if (filters.zone_id) {
    where.push("cp.zone_id = ?");
    params.push(Number(filters.zone_id));
  }

  if (filters.status) {
    where.push("cp.status = ?");
    params.push(String(filters.status).toUpperCase());
  }

  if (where.length) query += ` WHERE ${where.join(" AND ")}`;
  query += " ORDER BY cp.submitted_at DESC, cp.permit_id DESC";

  const [rows] = await pool.execute(query, params);
  return rows;
};

const getPermitById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT
       cp.permit_id,
       cp.zone_id,
       z.zone_name,
       cp.applicant_name,
       cp.project_title,
       cp.project_type,
       cp.surface_m2,
       cp.coord_lat,
       cp.coord_lon,
       cp.status,
       cp.rejection_reason,
       cp.submitted_by,
       cp.submitted_at,
       cp.reviewed_by,
       cp.reviewed_at
     FROM construction_permits cp
     JOIN coastal_zones z ON z.zone_id = cp.zone_id
     WHERE cp.permit_id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0] || null;
};

const createPermit = async (data, userId) => {
  const {
    zone_id,
    applicant_name,
    project_title,
    project_type,
    surface_m2,
    coord_lat,
    coord_lon,
  } = data;

  const [result] = await pool.execute(
    `INSERT INTO construction_permits
       (zone_id, applicant_name, project_title, project_type, surface_m2,
        coord_lat, coord_lon, submitted_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      zone_id,
      applicant_name,
      project_title,
      project_type || null,
      surface_m2 || null,
      coord_lat || null,
      coord_lon || null,
      userId || null,
    ],
  );

  return { permit_id: result.insertId, zone_id, applicant_name, project_title };
};

const reviewPermit = async (id, data, reviewerId) => {
  const allowedStatus = new Set(["APPROVED", "REJECTED"]);
  const status = String(data.status || "").toUpperCase();
  if (!allowedStatus.has(status)) return false;

  const rejectionReason =
    status === "REJECTED" ? data.rejection_reason || null : null;

  const [result] = await pool.execute(
    `UPDATE construction_permits
     SET status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
     WHERE permit_id = ?`,
    [status, rejectionReason, reviewerId || null, id],
  );

  return result.affectedRows > 0;
};

module.exports = {
  getAllPermits,
  getPermitById,
  createPermit,
  reviewPermit,
};
