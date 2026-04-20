// controllers/segmentController.js
const model = require("../models/segmentModel");
const { logAudit, getClientIp } = require("../models/auditLogModel");

// ─────────────────────────────────────────────
// GET /api/segments
// Accessible : tous les rôles connectés
// Filtres optionnels : ?zone=Taghazout  ?statut=critique
// ─────────────────────────────────────────────
const getAll = async (req, res) => {
  try {
    const data = await model.getAllSegments(req.query);
    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("[segmentController.getAll]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────
// GET /api/segments/:id
// ─────────────────────────────────────────────
const getOne = async (req, res) => {
  try {
    const seg = await model.getSegmentById(req.params.id);
    if (!seg) {
      return res.status(404).json({
        success: false,
        message: `Segment ID ${req.params.id} introuvable.`,
      });
    }
    return res.json({ success: true, data: seg });
  } catch (err) {
    console.error("[segmentController.getOne]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────
// POST /api/segments
// Permission requise : write:mesures (scientist, super_admin)
// ─────────────────────────────────────────────
const create = async (req, res) => {
  try {
    const actorUserId = req.user?.id || req.user?.user_id || null;
    if (!actorUserId) {
      return res.status(401).json({
        success: false,
        message: "Session invalide: identifiant utilisateur manquant.",
      });
    }

    // Validation minimale des champs obligatoires
    const required = [
      "nom_segment",
      "zone_geographique",
      "latitude_debut",
      "longitude_debut",
    ];
    for (const field of required) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `Champ obligatoire manquant : "${field}"`,
        });
      }
    }

    const seg = await model.createSegment(req.body, actorUserId);
    await logAudit({
      tableName: "coastal_zones",
      operation: "INSERT",
      recordId: seg.id_segment,
      fieldChanged: "segment_create",
      oldValue: null,
      newValue: seg,
      userId: actorUserId,
      ipAddress: getClientIp(req),
    });
    return res.status(201).json({
      success: true,
      message: "Zone côtière créée avec succès.",
      data: seg,
    });
  } catch (err) {
    console.error("[segmentController.create]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────
// PUT /api/segments/:id
// Admin: mise à jour d'un segment
// ─────────────────────────────────────────────
const update = async (req, res) => {
  try {
    const before = await model.getSegmentById(req.params.id);
    const ok = await model.updateSegment(req.params.id, req.body || {});
    if (!ok) {
      return res.status(404).json({
        success: false,
        message: "Segment introuvable ou aucun champ à mettre à jour.",
      });
    }
    const fresh = await model.getSegmentById(req.params.id);
    await logAudit({
      tableName: "coastal_zones",
      operation: "UPDATE",
      recordId: req.params.id,
      fieldChanged: "segment_update",
      oldValue: before,
      newValue: fresh,
      userId: req.user?.id || null,
      ipAddress: getClientIp(req),
    });
    return res.json({
      success: true,
      message: "Segment mis à jour.",
      data: fresh,
    });
  } catch (err) {
    console.error("[segmentController.update]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/segments/:id
// Admin: suppression d'un segment
// ─────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const before = await model.getSegmentById(req.params.id);
    const ok = await model.deleteSegment(req.params.id);
    if (!ok) {
      return res
        .status(404)
        .json({ success: false, message: "Segment introuvable." });
    }
    await logAudit({
      tableName: "coastal_zones",
      operation: "DELETE",
      recordId: req.params.id,
      fieldChanged: "segment_delete",
      oldValue: before,
      newValue: null,
      userId: req.user?.id || null,
      ipAddress: getClientIp(req),
    });
    return res.json({ success: true, message: "Segment supprimé." });
  } catch (err) {
    console.error("[segmentController.remove]", err.message);
    if (err.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({
        success: false,
        message:
          "Suppression impossible : la structure de la base de données est incomplète.",
      });
    }
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        success: false,
        message:
          "Suppression impossible : ce segment est encore référencé par d'autres données.",
      });
    }
    const isDev = process.env.NODE_ENV !== "production";
    return res.status(500).json({
      success: false,
      message: isDev
        ? `Erreur serveur (${err.code || "UNKNOWN"}) : ${err.message}`
        : "Erreur serveur.",
    });
  }
};

// ─────────────────────────────────────────────
// GET /api/segments/:id/recul
// Calcul du recul 2016→2026 via Haversine
// ─────────────────────────────────────────────
const getRecul = async (req, res) => {
  try {
    const data = await model.getReculHaversine(req.params.id);
    if (!data) {
      return res.status(404).json({
        success: false,
        message:
          "Données insuffisantes pour calculer le recul (mesures 2016 et 2026 requises).",
      });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error("[segmentController.getRecul]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

module.exports = { getAll, getOne, create, update, remove, getRecul };
