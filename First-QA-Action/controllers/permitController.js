const model = require("../models/permitModel");
const { logAudit, getClientIp } = require("../models/auditLogModel");

const getAll = async (req, res) => {
  try {
    const data = await model.getAllPermits(req.query || {});
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error("[permitController.getAll]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

const getOne = async (req, res) => {
  try {
    const permit = await model.getPermitById(req.params.id);
    if (!permit) {
      return res
        .status(404)
        .json({ success: false, message: "Permis introuvable." });
    }
    return res.json({ success: true, data: permit });
  } catch (err) {
    console.error("[permitController.getOne]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

const create = async (req, res) => {
  try {
    const required = ["zone_id", "applicant_name", "project_title"];
    for (const f of required) {
      if (!req.body[f]) {
        return res
          .status(400)
          .json({ success: false, message: `Champ requis : \"${f}\"` });
      }
    }

    const permit = await model.createPermit(req.body, req.user?.id || null);

    await logAudit({
      tableName: "construction_permits",
      operation: "INSERT",
      recordId: permit.permit_id,
      fieldChanged: "permit_create",
      oldValue: null,
      newValue: permit,
      userId: req.user?.id || null,
      ipAddress: getClientIp(req),
    });

    return res.status(201).json({ success: true, data: permit });
  } catch (err) {
    console.error("[permitController.create]", err.message);

    if (
      String(err.message || "").includes(
        "Construction forbidden in RED coastal zone",
      )
    ) {
      return res.status(409).json({
        success: false,
        message: "Permis bloqué automatiquement : zone classée RED.",
      });
    }

    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

const review = async (req, res) => {
  try {
    const before = await model.getPermitById(req.params.id);
    const ok = await model.reviewPermit(
      req.params.id,
      req.body || {},
      req.user?.id || null,
    );

    if (!ok) {
      return res.status(400).json({
        success: false,
        message:
          "Statut invalide ou permis introuvable (APPROVED/REJECTED attendu).",
      });
    }

    const fresh = await model.getPermitById(req.params.id);
    await logAudit({
      tableName: "construction_permits",
      operation: "UPDATE",
      recordId: req.params.id,
      fieldChanged: "permit_review",
      oldValue: before,
      newValue: fresh,
      userId: req.user?.id || null,
      ipAddress: getClientIp(req),
    });

    return res.json({ success: true, data: fresh });
  } catch (err) {
    console.error("[permitController.review]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

module.exports = { getAll, getOne, create, review };
