// routes/authRoutes.js
// Point d'entrée public — aucun middleware d'auth requis ici
const router = require('express').Router();
const { login } = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', login);

module.exports = router;
