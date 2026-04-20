const bcrypt = require("bcryptjs");
const model = require("../models/userModel");
const { logAudit, getClientIp } = require("../models/auditLogModel");

const getAll = async (req, res) => {
  try {
    const users = await model.getAllUsers();
    return res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    console.error("[userController.getAll]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await model.getRoles();
    return res.json({ success: true, count: roles.length, data: roles });
  } catch (err) {
    console.error("[userController.getRoles]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

const create = async (req, res) => {
  try {
    const {
      role_id,
      username,
      email,
      password,
      full_name,
      organisme,
      is_active,
    } = req.body || {};

    if (!role_id || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "role_id, username, email et password sont requis.",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 6 caractères.",
      });
    }

    const password_hash = await bcrypt.hash(String(password), 12);
    const newId = await model.createUser({
      role_id,
      username: String(username).trim(),
      email: String(email).trim().toLowerCase(),
      password_hash,
      full_name: full_name ? String(full_name).trim() : null,
      organisme: organisme ? String(organisme).trim() : null,
      is_active: is_active === undefined ? true : !!is_active,
    });

    const fresh = await model.getUserById(newId);
    await logAudit({
      tableName: "users",
      operation: "INSERT",
      recordId: newId,
      fieldChanged: "user_create",
      oldValue: null,
      newValue: fresh,
      userId: req.user?.id || null,
      ipAddress: getClientIp(req),
    });
    return res
      .status(201)
      .json({ success: true, message: "Utilisateur créé.", data: fresh });
  } catch (err) {
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email ou username déjà utilisé.",
      });
    }
    if (err && err.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ success: false, message: "Rôle invalide." });
    }

    console.error("[userController.create]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

const update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = { ...(req.body || {}) };
    const before = await model.getUserById(id);

    if ("password" in payload) {
      if (!payload.password || String(payload.password).length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Mot de passe invalide (au moins 6 caractères) ou retirez le champ password.",
        });
      }
      payload.password_hash = await bcrypt.hash(String(payload.password), 12);
      delete payload.password;
    }

    if ("email" in payload && payload.email) {
      payload.email = String(payload.email).trim().toLowerCase();
    }
    if ("username" in payload && payload.username) {
      payload.username = String(payload.username).trim();
    }
    if ("full_name" in payload && payload.full_name != null) {
      payload.full_name = String(payload.full_name).trim();
    }
    if ("organisme" in payload && payload.organisme != null) {
      payload.organisme = String(payload.organisme).trim();
    }

    const ok = await model.updateUser(id, payload);
    if (!ok) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable ou aucun champ modifié.",
      });
    }

    const fresh = await model.getUserById(id);
    await logAudit({
      tableName: "users",
      operation: "UPDATE",
      recordId: id,
      fieldChanged: "user_update",
      oldValue: before,
      newValue: fresh,
      userId: req.user?.id || null,
      ipAddress: getClientIp(req),
    });
    return res.json({
      success: true,
      message: "Utilisateur mis à jour.",
      data: fresh,
    });
  } catch (err) {
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email ou username déjà utilisé.",
      });
    }
    if (err && err.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ success: false, message: "Rôle invalide." });
    }

    console.error("[userController.update]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

const remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const before = await model.getUserById(id);
    if (req.user?.id && Number(req.user.id) === id) {
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez pas supprimer votre propre compte.",
      });
    }

    const ok = await model.deleteUser(id);
    if (!ok) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur introuvable." });
    }

    await logAudit({
      tableName: "users",
      operation: "DELETE",
      recordId: id,
      fieldChanged: "user_delete",
      oldValue: before,
      newValue: null,
      userId: req.user?.id || null,
      ipAddress: getClientIp(req),
    });

    return res.json({ success: true, message: "Utilisateur supprimé." });
  } catch (err) {
    console.error("[userController.remove]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

module.exports = { getAll, getRoles, create, update, remove };
