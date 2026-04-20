// middleware/rbac.js
const pool = require("../config/database");

const ROLE_CACHE = new Map();
const ROLE_CACHE_TTL_MS = 60 * 1000;

const loadRoleCapabilities = async (roleName) => {
  const key = String(roleName || "").toLowerCase();
  const now = Date.now();
  const cached = ROLE_CACHE.get(key);
  if (cached && cached.expiresAt > now) return cached.value;

  const [rows] = await pool.execute(
    `SELECT role_name, can_read, can_write, can_admin, can_audit
     FROM roles
     WHERE role_name = ?
     LIMIT 1`,
    [key],
  );

  const row = rows[0] || null;
  const value = row
    ? {
        role_name: row.role_name,
        can_read: !!row.can_read,
        can_write: !!row.can_write,
        can_admin: !!row.can_admin,
        can_audit: !!row.can_audit,
      }
    : null;

  ROLE_CACHE.set(key, { value, expiresAt: now + ROLE_CACHE_TTL_MS });
  return value;
};

const isPermissionAllowed = (permission, caps) => {
  if (!caps || !permission) return false;
  if (caps.can_admin) return true;

  if (permission === "view:audit") return caps.can_audit;
  if (permission === "read:alertes") return caps.can_read || caps.can_write;
  if (permission === "manage:users" || permission === "delete:all")
    return caps.can_admin;

  if (permission.startsWith("read:")) return caps.can_read;
  if (permission.startsWith("write:")) return caps.can_write;
  if (permission.startsWith("generate:") || permission.startsWith("export:"))
    return caps.can_read;

  return false;
};

const authorize = (permission) => async (req, res, next) => {
  try {
    const role = req.user?.role;
    if (!role) {
      return res
        .status(403)
        .json({ success: false, message: "Aucun rôle utilisateur." });
    }

    const caps = await loadRoleCapabilities(role);
    if (!caps) {
      return res
        .status(403)
        .json({
          success: false,
          message: `Rôle "${role}" introuvable en base.`,
        });
    }

    if (isPermissionAllowed(permission, caps)) return next();

    return res.status(403).json({
      success: false,
      message: `Accès refusé. Rôle "${role}" → "${permission}" requis.`,
    });
  } catch (err) {
    console.error("[rbac.authorize]", err.message);
    return res.status(500).json({ success: false, message: "Erreur RBAC." });
  }
};

module.exports = { authorize };
