// controllers/alerteController.js
const model = require('../models/alerteModel');

const parsePositiveInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

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

    if (typeof req.body.message !== 'string' || req.body.message.length > 1000) {
      return res.status(400).json({ success: false, message: 'Message invalide.' });
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
    const idAlerte = parsePositiveInt(req.params.id);
    if (!idAlerte) {
      return res.status(400).json({ success: false, message: 'ID alerte invalide.' });
    }

    const ok = await model.acquitterAlerte(idAlerte, req.user.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Alerte introuvable.' });
    return res.json({ success: true, message: 'Alerte acquittée.' });
  } catch (err) {
    console.error('[alerteController.ack]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

module.exports = { getAll, create, ack };
