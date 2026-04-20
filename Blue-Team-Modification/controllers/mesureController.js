// controllers/mesureController.js
const model = require('../models/mesureModel');

const parsePositiveInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

// GET /api/mesures — toutes les mesures (limité à 50 par défaut)
const getAll = async (req, res) => {
  try {
    const rawLimit = parsePositiveInt(req.query.limit) || 50;
    const limit = Math.min(rawLimit, 100);
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
    const idZone = parsePositiveInt(req.params.id_zone);
    if (!idZone) {
      return res.status(400).json({ success: false, message: 'ID zone invalide.' });
    }

    const data = await model.getMesuresByZone(idZone);
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

    const idZone = parsePositiveInt(req.body.id_zone);
    const latitude = parseFiniteNumber(req.body.latitude);
    const longitude = parseFiniteNumber(req.body.longitude);

    if (!idZone) {
      return res.status(400).json({ success: false, message: 'id_zone invalide.' });
    }
    if (latitude == null || latitude < -90 || latitude > 90) {
      return res.status(400).json({ success: false, message: 'Latitude invalide.' });
    }
    if (longitude == null || longitude < -180 || longitude > 180) {
      return res.status(400).json({ success: false, message: 'Longitude invalide.' });
    }

    const mesure = await model.createMesure(req.body, req.user.id);
    return res.status(201).json({ success: true, data: mesure });
  } catch (err) {
    console.error('[mesureController.create]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

module.exports = { getAll, getByZone, create };
