// controllers/authController.js
// Utilise les tables : users + roles (noms du schema.sql)
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/database');
const {
  validateJwtSecret,
  getJwtSignOptions,
  revokeToken
} = require('../middleware/jwtSecurity');
const {
  registerFailedLogin,
  registerSuccessfulLogin
} = require('../middleware/bruteForce');
require('dotenv').config();

validateJwtSecret();

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
        message: 'Email et mot de passe requis.'
      });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Format des identifiants invalide.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.length > 254 || password.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Identifiants invalides.'
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
         r.role_name,
         r.can_read,
         r.can_write,
         r.can_admin,
         r.can_audit
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.email = ? AND u.is_active = 1
       LIMIT 1`,
      [normalizedEmail]  // ← jamais concaténé dans la requête
    );

    // Utilisateur introuvable OU mot de passe incorrect
    // On retourne le même message dans les deux cas (sécurité : ne pas indiquer lequel)
    if (!users.length) {
      registerFailedLogin(req, normalizedEmail);
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects.'
      });
    }

    const user = users[0];
    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      registerFailedLogin(req, normalizedEmail);
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects.'
      });
    }

    // Mettre à jour last_login
    await pool.execute(
      `UPDATE users SET last_login = NOW() WHERE user_id = ?`,
      [user.user_id]
    );

    // Générer le JWT — le rôle est inclus pour que RBAC puisse le lire
    const token = jwt.sign(
      {
        id:        user.user_id,
        email:     user.email,
        username:  user.username,
        role:      user.role_name.toLowerCase(), // ex : 'super_admin', 'analyst'
        can_write: user.can_write,
        can_admin: user.can_admin
      },
      process.env.JWT_SECRET,
      getJwtSignOptions()
    );

    registerSuccessfulLogin(req, normalizedEmail);

    return res.status(200).json({
      success: true,
      message: `Bienvenue, ${user.full_name || user.username} (${user.role_name})`,
      token,
      user: {
        id:       user.user_id,
        email:    user.email,
        username: user.username,
        role:     user.role_name.toLowerCase()
      }
    });

  } catch (err) {
    console.error('[authController.login]', err.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'authentification.'
    });
  }
};

const logout = async (req, res) => {
  try {
    revokeToken(req.user);
    return res.status(200).json({
      success: true,
      message: 'Session fermee. Token revoque.'
    });
  } catch (err) {
    console.error('[authController.logout]', err.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la deconnexion.'
    });
  }
};

module.exports = { login, logout };
