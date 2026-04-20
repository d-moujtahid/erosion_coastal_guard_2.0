// server.js — Point d'entrée principal Erosion-Coastal Guard API
const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

// ══════════════════════════════════════════
//  MIDDLEWARES GLOBAUX
// ══════════════════════════════════════════

// CORS — contrôle qui peut appeler l'API depuis l'extérieur
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parser JSON — limite 10mb pour les données GPS volumineuses
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ══════════════════════════════════════════
//  FRONTEND STATIQUE
//  Express sert lui-même le fichier HTML
//  → Ouvrir http://localhost:5000 dans le navigateur
//  → Pas de problème CORS en local
// ══════════════════════════════════════════
app.use(express.static(path.join(__dirname, 'frontend')));

// ══════════════════════════════════════════
//  ROUTES API — toutes actives
// ══════════════════════════════════════════
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/segments', require('./routes/segmentRoutes'));
app.use('/api/mesures',  require('./routes/mesureRoutes'));
app.use('/api/alertes',  require('./routes/alerteRoutes'));

// Route de santé — pour vérifier que le serveur tourne
app.get('/api/health', (req, res) => {
  res.json({
    status:      'OK',
    project:     'Erosion-Coastal Guard',
    version:     '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp:   new Date().toISOString()
  });
});

// Toute route non-API renvoie le frontend (utile pour Vercel/déploiement)
app.get('*', (req, res) => {
  // Si la route commence par /api, c'est un 404 API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `Route "${req.originalUrl}" introuvable.`
    });
  }
  // Sinon servir le frontend HTML
  res.sendFile(path.join(__dirname, 'frontend', 'erosion-coastal-guard.html'));
});

// ══════════════════════════════════════════
//  DÉMARRAGE
// ══════════════════════════════════════════
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  🌊 ════════════════════════════════════════
  🏗️  Erosion-Coastal Guard — Backend API
  📍  Monitoring : Agadir & Taghazout
  🚀  Serveur    : http://localhost:${PORT}
  🌐  Dashboard  : http://localhost:${PORT}
  🔐  Sécurité   : JWT + RBAC (5 rôles) + Anti-SQLi
  🌍  Env        : ${process.env.NODE_ENV}
  ════════════════════════════════════════
  `);
});
