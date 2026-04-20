// routes/dashboardRoutes.js
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const ctrl = require('../controllers/dashboardController');

router.get('/summary', authenticate, authorize('read:segments'), ctrl.getSummary);

module.exports = router;
