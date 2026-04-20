const pool = require("../config/database");

const toAuditText = (value) => {
  if (value === undefined || value === null) return null;
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  return String(raw).slice(0, 65000);
};

const getClientIp = (req) => {
  const forwarded = req?.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req?.ip || req?.socket?.remoteAddress || null;
};

const logAudit = async ({
  tableName,
  operation,
  recordId,
  fieldChanged = null,
  oldValue = null,
  newValue = null,
  userId = null,
  ipAddress = null,
}) => {
  try {
    const safeRecordId = Number(recordId);
    const finalRecordId =
      Number.isFinite(safeRecordId) && safeRecordId >= 0
        ? Math.trunc(safeRecordId)
        : 0;

    await pool.execute(
      `INSERT INTO audit_log
         (table_name, operation, record_id, field_changed, old_value, new_value, user_id, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tableName,
        operation,
        finalRecordId,
        fieldChanged,
        toAuditText(oldValue),
        toAuditText(newValue),
        userId || null,
        ipAddress || null,
      ],
    );

    return true;
  } catch (err) {
    console.error("[auditLogModel.logAudit]", err.message);
    return false;
  }
};

module.exports = { logAudit, getClientIp };
