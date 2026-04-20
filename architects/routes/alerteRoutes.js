// routes/alerteRoutes.js
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize }    = require('../middleware/rbac');
const ctrl             = require('../controllers/alerteController');

// Lecture des alertes actives
router.get('/',          authenticate, authorize('read:alertes'),  ctrl.getAll);

// Créer une alerte manuellement (operator, super_admin)
router.post('/',         authenticate, authorize('write:alertes'), ctrl.create);

// Acquitter une alerte (la marquer comme traitée)
router.put('/:id/ack',   authenticate, authorize('write:alertes'), ctrl.ack);

module.exports = router;
