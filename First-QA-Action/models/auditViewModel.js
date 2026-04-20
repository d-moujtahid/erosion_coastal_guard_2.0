const pool = require("../config/database");

const getRecentAuditLogs = async (limit = 100) => {
  const n = Number(limit);
  const safeLimit = Number.isFinite(n)
    ? Math.max(1, Math.min(500, Math.trunc(n)))
    : 100;

  const [rows] = await pool.execute(
    `SELECT
       al.log_id,
       al.table_name,
       al.operation,
       al.record_id,
       al.field_changed,
       al.old_value,
       al.new_value,
       al.user_id,
       u.username,
       al.ip_address,
       al.logged_at
     FROM audit_log al
     LEFT JOIN users u ON u.user_id = al.user_id
     ORDER BY al.logged_at DESC, al.log_id DESC
     LIMIT ?`,
    [safeLimit],
  );

  return rows;
};

module.exports = { getRecentAuditLogs };
