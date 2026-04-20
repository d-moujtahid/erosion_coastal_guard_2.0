// routes/segmentRoutes.js
// Chaîne middleware : authenticate → authorize(permission) → controller
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize }    = require('../middleware/rbac');
const ctrl             = require('../controllers/segmentController');

// Lecture — accessible à tous les rôles connectés
router.get('/',          authenticate, authorize('read:segments'), ctrl.getAll);
router.get('/:id',       authenticate, authorize('read:segments'), ctrl.getOne);

// Calcul recul Haversine 2016→2026 pour un segment
router.get('/:id/recul', authenticate, authorize('read:segments'), ctrl.getRecul);

// Création — scientist et super_admin uniquement (write:mesures)
router.post('/',         authenticate, authorize('write:mesures'), ctrl.create);

module.exports = router;
