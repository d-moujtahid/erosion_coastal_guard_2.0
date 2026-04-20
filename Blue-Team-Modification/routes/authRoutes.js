// routes/authRoutes.js
// Point d'entrée public — aucun middleware d'auth requis ici
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { preLoginCheck } = require('../middleware/bruteForce');
const { login, logout } = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', preLoginCheck, login);

// POST /api/auth/logout
router.post('/logout', authenticate, logout);

module.exports = router;
