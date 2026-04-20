// controllers/mesureController.js
const model = require("../models/mesureModel");
const { logAudit, getClientIp } = require("../models/auditLogModel");

// GET /api/mesures — toutes les mesures (limité à 50 par défaut)
const getAll = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const data = await model.getAllMesures(limit);
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error("[mesureController.getAll]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// GET /api/mesures/:id_zone — mesures d'une zone spécifique
const getByZone = async (req, res) => {
  try {
    const data = await model.getMesuresByZone(req.params.id_zone);
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error("[mesureController.getByZone]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// POST /api/mesures — ajouter une mesure terrain
const create = async (req, res) => {
  try {
    const actorUserId = req.user?.id || req.user?.user_id || null;
    if (!actorUserId) {
      return res.status(401).json({
        success: false,
        message: "Session invalide: identifiant utilisateur manquant.",
      });
    }

    const required = ["id_zone", "latitude", "longitude"];
    for (const f of required) {
      if (!req.body[f]) {
        return res
          .status(400)
          .json({ success: false, message: `Champ requis : "${f}"` });
      }
    }
    const mesure = await model.createMesure(req.body, actorUserId);
    const recul = await model.recomputeRetreatMeasurement(
      req.body.id_zone,
      actorUserId,
    );
    await logAudit({
      tableName: "coastline_points",
      operation: "INSERT",
      recordId: mesure.id_mesure,
      fieldChanged: "mesure_create",
      oldValue: null,
      newValue: { mesure, recul },
      userId: actorUserId,
      ipAddress: getClientIp(req),
    });
    return res.status(201).json({ success: true, data: { mesure, recul } });
  } catch (err) {
    console.error("[mesureController.create]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// PUT /api/mesures/points/:id_mesure — modifier une mesure terrain
const update = async (req, res) => {
  try {
    const before = await model.getMesureById(req.params.id_mesure);
    const ok = await model.updateMesure(req.params.id_mesure, req.body || {});
    if (!ok) {
      return res.status(404).json({
        success: false,
        message: "Mesure introuvable ou aucun champ à mettre à jour.",
      });
    }
    const fresh = await model.getMesureById(req.params.id_mesure);
    const recul = await model.recomputeRetreatMeasurement(
      fresh?.id_segment,
      req.user?.id || null,
    );
    await logAudit({
      tableName: "coastline_points",
      operation: "UPDATE",
      recordId: req.params.id_mesure,
      fieldChanged: "mesure_update",
      oldValue: before,
      newValue: { mesure: fresh, recul },
      userId: req.user?.id || null,
      ipAddress: getClientIp(req),
    });
    return res.json({ success: true, data: { mesure: fresh, recul } });
  } catch (err) {
    console.error("[mesureController.update]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// GET /api/mesures/:id_zone/historique — historique d'une zone
const getHistoriqueByZone = async (req, res) => {
  try {
    const data = await model.getHistoriqueByZone(req.params.id_zone);
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error("[mesureController.getHistoriqueByZone]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// POST /api/mesures/historique — ajouter une entrée historique
const createHistorique = async (req, res) => {
  try {
    const actorUserId = req.user?.id || req.user?.user_id || null;
    if (!actorUserId) {
      return res.status(401).json({
        success: false,
        message: "Session invalide: identifiant utilisateur manquant.",
      });
    }

    const required = ["id_zone", "reference_year", "latitude", "longitude"];
    for (const f of required) {
      if (!req.body[f]) {
        return res
          .status(400)
          .json({ success: false, message: `Champ requis : "${f}"` });
      }
    }
    const historique = await model.createHistorique(req.body, actorUserId);
    const recul = await model.recomputeRetreatMeasurement(
      req.body.id_zone,
      actorUserId,
    );
    await logAudit({
      tableName: "coastline_history",
      operation: "INSERT",
      recordId: historique.id_historique,
      fieldChanged: "historique_create",
      oldValue: null,
      newValue: { historique, recul },
      userId: actorUserId,
      ipAddress: getClientIp(req),
    });
    return res.status(201).json({ success: true, data: { historique, recul } });
  } catch (err) {
    console.error("[mesureController.createHistorique]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// PUT /api/mesures/historique/:id_historique — modifier l'historique
const updateHistorique = async (req, res) => {
  try {
    const actorUserId = req.user?.id || req.user?.user_id || null;
    if (!actorUserId) {
      return res.status(401).json({
        success: false,
        message: "Session invalide: identifiant utilisateur manquant.",
      });
    }

    const before = await model.getHistoriqueById(req.params.id_historique);
    const ok = await model.updateHistorique(
      req.params.id_historique,
      req.body || {},
      actorUserId,
    );
    if (!ok) {
      return res.status(404).json({
        success: false,
        message: "Historique introuvable ou aucun champ à mettre à jour.",
      });
    }
    const fresh = await model.getHistoriqueById(req.params.id_historique);
    const recul = await model.recomputeRetreatMeasurement(
      fresh?.id_segment,
      actorUserId,
    );
    await logAudit({
      tableName: "coastline_history",
      operation: "UPDATE",
      recordId: req.params.id_historique,
      fieldChanged: "historique_update",
      oldValue: before,
      newValue: { historique: fresh, recul },
      userId: actorUserId,
      ipAddress: getClientIp(req),
    });
    return res.json({ success: true, data: { historique: fresh, recul } });
  } catch (err) {
    console.error("[mesureController.updateHistorique]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

module.exports = {
  getAll,
  getByZone,
  create,
  update,
  getHistoriqueByZone,
  createHistorique,
  updateHistorique,
};
