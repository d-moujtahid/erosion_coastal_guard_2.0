const pool = require("../config/database");

const getAllUsers = async () => {
  const [rows] = await pool.execute(
    `SELECT
       u.user_id,
       u.role_id,
       r.role_name,
       u.username,
       u.email,
       u.full_name,
       u.organisme,
       u.is_active,
       u.last_login,
       u.created_at,
       u.updated_at
     FROM users u
     JOIN roles r ON r.role_id = u.role_id
     ORDER BY u.created_at DESC`,
  );
  return rows;
};

const getRoles = async () => {
  const [rows] = await pool.execute(
    `SELECT role_id, role_name, description, can_read, can_write, can_admin, can_audit
     FROM roles
     ORDER BY role_id ASC`,
  );
  return rows;
};

const createUser = async (data) => {
  const {
    role_id,
    username,
    email,
    password_hash,
    full_name,
    organisme,
    is_active,
  } = data;

  const [result] = await pool.execute(
    `INSERT INTO users
      (role_id, username, email, password_hash, full_name, organisme, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      role_id,
      username,
      email,
      password_hash,
      full_name || null,
      organisme || null,
      is_active ? 1 : 0,
    ],
  );

  return result.insertId;
};

const updateUser = async (id, data) => {
  const allowed = {
    role_id: "role_id",
    username: "username",
    email: "email",
    full_name: "full_name",
    organisme: "organisme",
    is_active: "is_active",
    password_hash: "password_hash",
  };

  const sets = [];
  const params = [];

  Object.keys(allowed).forEach((k) => {
    if (!(k in data)) return;

    if (k === "is_active") {
      sets.push(`${allowed[k]} = ?`);
      params.push(data[k] ? 1 : 0);
      return;
    }

    sets.push(`${allowed[k]} = ?`);
    params.push(data[k]);
  });

  if (!sets.length) return false;

  params.push(id);
  const [result] = await pool.execute(
    `UPDATE users
     SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    params,
  );

  return result.affectedRows > 0;
};

const getUserById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT
       u.user_id,
       u.role_id,
       r.role_name,
       u.username,
       u.email,
       u.full_name,
       u.organisme,
       u.is_active,
       u.last_login,
       u.created_at,
       u.updated_at
     FROM users u
     JOIN roles r ON r.role_id = u.role_id
     WHERE u.user_id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0] || null;
};

const deleteUser = async (id) => {
  const [result] = await pool.execute(`DELETE FROM users WHERE user_id = ?`, [
    id,
  ]);
  return result.affectedRows > 0;
};

module.exports = {
  getAllUsers,
  getRoles,
  createUser,
  updateUser,
  getUserById,
  deleteUser,
};
