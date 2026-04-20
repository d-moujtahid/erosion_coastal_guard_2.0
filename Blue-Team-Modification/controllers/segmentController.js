// controllers/segmentController.js
const model = require('../models/segmentModel');

const parsePositiveInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

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
      data
    });
  } catch (err) {
    console.error('[segmentController.getAll]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────
// GET /api/segments/:id
// ─────────────────────────────────────────────
const getOne = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID segment invalide.' });
    }

    const seg = await model.getSegmentById(id);
    if (!seg) {
      return res.status(404).json({
        success: false,
        message: `Segment ID ${req.params.id} introuvable.`
      });
    }
    return res.json({ success: true, data: seg });
  } catch (err) {
    console.error('[segmentController.getOne]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────
// POST /api/segments
// Permission requise : write:mesures (scientist, super_admin)
// ─────────────────────────────────────────────
const create = async (req, res) => {
  try {
    // Validation minimale des champs obligatoires
    const required = ['nom_segment', 'zone_geographique', 'latitude_debut', 'longitude_debut'];
    for (const field of required) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `Champ obligatoire manquant : "${field}"`
        });
      }
    }

    const latitude = parseFiniteNumber(req.body.latitude_debut);
    const longitude = parseFiniteNumber(req.body.longitude_debut);

    if (latitude == null || latitude < -90 || latitude > 90) {
      return res.status(400).json({ success: false, message: 'Latitude invalide.' });
    }
    if (longitude == null || longitude < -180 || longitude > 180) {
      return res.status(400).json({ success: false, message: 'Longitude invalide.' });
    }

    const seg = await model.createSegment(req.body);
    return res.status(201).json({
      success: true,
      message: 'Zone côtière créée avec succès.',
      data: seg
    });
  } catch (err) {
    console.error('[segmentController.create]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────
// GET /api/segments/:id/recul
// Calcul du recul 2016→2026 via Haversine
// ─────────────────────────────────────────────
const getRecul = async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID segment invalide.' });
    }

    const data = await model.getReculHaversine(id);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Données insuffisantes pour calculer le recul (mesures 2016 et 2026 requises).'
      });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[segmentController.getRecul]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

module.exports = { getAll, getOne, create, getRecul };
