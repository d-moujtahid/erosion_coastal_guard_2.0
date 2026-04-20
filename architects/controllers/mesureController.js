// controllers/mesureController.js
const model = require('../models/mesureModel');

// GET /api/mesures — toutes les mesures (limité à 50 par défaut)
const getAll = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const data  = await model.getAllMesures(limit);
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('[mesureController.getAll]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// GET /api/mesures/:id_zone — mesures d'une zone spécifique
const getByZone = async (req, res) => {
  try {
    const data = await model.getMesuresByZone(req.params.id_zone);
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('[mesureController.getByZone]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// POST /api/mesures — ajouter une mesure terrain
const create = async (req, res) => {
  try {
    const required = ['id_zone', 'latitude', 'longitude'];
    for (const f of required) {
      if (!req.body[f]) {
        return res.status(400).json({ success: false, message: `Champ requis : "${f}"` });
      }
    }
    const mesure = await model.createMesure(req.body, req.user.id);
    return res.status(201).json({ success: true, data: mesure });
  } catch (err) {
    console.error('[mesureController.create]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

module.exports = { getAll, getByZone, create };
