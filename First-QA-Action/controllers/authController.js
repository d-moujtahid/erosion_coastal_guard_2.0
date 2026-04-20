// controllers/authController.js
// Utilise les tables : users + roles (noms du schema.sql)
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const { logAudit, getClientIp } = require("../models/auditLogModel");
require("dotenv").config();

const buildPermissionsFromCapabilities = (roleRow) => {
  const perms = new Set();
  const canRead = !!roleRow.can_read;
  const canWrite = !!roleRow.can_write;
  const canAdmin = !!roleRow.can_admin;
  const canAudit = !!roleRow.can_audit;

  if (canRead) {
    perms.add("read:all");
    perms.add("read:segments");
    perms.add("read:mesures");
    perms.add("read:alertes");
  }
  if (canWrite) {
    perms.add("write:all");
    perms.add("write:mesures");
    perms.add("write:alertes");
    perms.add("read:alertes");
  }
  if (canAdmin) {
    perms.add("delete:all");
    perms.add("manage:users");
  }
  if (canAudit || canAdmin) {
    perms.add("view:audit");
  }

  return Array.from(perms);
};

// ─────────────────────────────────────────────
// POST /api/auth/login
// Authentifie un utilisateur → retourne un JWT avec son rôle
// ─────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des champs obligatoires
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis.",
      });
    }

    // Chercher l'utilisateur en joignant la table roles
    // ✅ Parameterized Query — protégé contre l'injection SQL
    // ✅ Utilise les vrais noms de tables du schema.sql : users + roles
    const [users] = await pool.execute(
      `SELECT
         u.user_id,
         u.email,
         u.username,
         u.full_name,
         u.password_hash,
         u.is_active,
         u.last_login,
         r.role_name,
         r.can_read,
         r.can_write,
         r.can_admin,
         r.can_audit
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.email = ? AND u.is_active = 1
       LIMIT 1`,
      [email], // ← jamais concaténé dans la requête
    );

    // Utilisateur introuvable OU mot de passe incorrect
    // On retourne le même message dans les deux cas (sécurité : ne pas indiquer lequel)
    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects.",
      });
    }

    const user = users[0];
    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects.",
      });
    }

    // Mettre à jour last_login
    const previousLastLogin = user.last_login;
    await pool.execute(
      `UPDATE users SET last_login = NOW() WHERE user_id = ?`,
      [user.user_id],
    );
    await logAudit({
      tableName: "users",
      operation: "UPDATE",
      recordId: user.user_id,
      fieldChanged: "last_login",
      oldValue: previousLastLogin,
      newValue: { event: "login", at: new Date().toISOString() },
      userId: user.user_id,
      ipAddress: getClientIp(req),
    });

    // Générer le JWT — le rôle est inclus pour que RBAC puisse le lire
    const token = jwt.sign(
      {
        id: user.user_id,
        email: user.email,
        username: user.username,
        role: user.role_name.toLowerCase(), // ex : 'super_admin', 'analyst'
        can_read: !!user.can_read,
        can_write: user.can_write,
        can_admin: user.can_admin,
        can_audit: !!user.can_audit,
        permissions: buildPermissionsFromCapabilities(user),
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
    );

    const role = user.role_name.toLowerCase();
    const permissions = buildPermissionsFromCapabilities(user);
    const isAdmin = !!user.can_admin || role === "super_admin";

    return res.status(200).json({
      success: true,
      message: `Bienvenue, ${user.full_name || user.username} (${user.role_name})`,
      token,
      user: {
        id: user.user_id,
        email: user.email,
        username: user.username,
        role,
        can_read: !!user.can_read,
        can_write: !!user.can_write,
        can_admin: !!user.can_admin,
        can_audit: !!user.can_audit,
        permissions,
        is_admin: isAdmin,
      },
      permissions,
      is_admin: isAdmin,
    });
  } catch (err) {
    console.error("[authController.login]", err.message);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'authentification.",
    });
  }
};

module.exports = { login };
