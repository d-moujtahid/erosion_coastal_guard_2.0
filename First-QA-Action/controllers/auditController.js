const model = require("../models/auditViewModel");

const getRecent = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const data = await model.getRecentAuditLogs(limit);
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error("[auditController.getRecent]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

module.exports = { getRecent };
