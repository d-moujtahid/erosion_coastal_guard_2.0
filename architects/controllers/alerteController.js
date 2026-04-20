// controllers/alerteController.js
const model = require('../models/alerteModel');

// GET /api/alertes — toutes les alertes non acquittées
const getAll = async (req, res) => {
  try {
    const data = await model.getAllAlertes();
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('[alerteController.getAll]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// POST /api/alertes — créer une alerte manuellement
const create = async (req, res) => {
  try {
    if (!req.body.message) {
      return res.status(400).json({ success: false, message: 'Le champ "message" est requis.' });
    }
    const alerte = await model.createAlerte(req.body);
    return res.status(201).json({ success: true, data: alerte });
  } catch (err) {
    console.error('[alerteController.create]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// PUT /api/alertes/:id/ack — acquitter (marquer comme traitée)
const ack = async (req, res) => {
  try {
    const ok = await model.acquitterAlerte(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Alerte introuvable.' });
    return res.json({ success: true, message: 'Alerte acquittée.' });
  } catch (err) {
    console.error('[alerteController.ack]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

module.exports = { getAll, create, ack };
