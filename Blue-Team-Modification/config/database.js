// config/database.js
// Le pool MySQL est partagé par tous les models — une seule connexion réutilisée
const mysql = require('mysql2/promise');
require('dotenv').config();
const { demoPool } = require('./demoData');

let pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME,   // = erosion_coastal_guard (même nom que schema.sql)
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  connectionLimit:  10,
  waitForConnections: true,
  queueLimit: 0,

  // TLS désactivé en local XAMPP, activé automatiquement en production (Render + PlanetScale)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,

  timezone: '+01:00',  // Maroc UTC+1 — important pour les dates de mesures GPS
  charset:  'utf8mb4'
});

// Test de connexion immédiat au démarrage du serveur
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connecté — ' + process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.warn('⚠️  MySQL indisponible, passage en mode démo.');
    console.warn('💡 Détail:', err.message);
    pool = demoPool;
  }
})();

module.exports = {
  execute: (...args) => pool.execute(...args),
  getConnection: (...args) => pool.getConnection(...args)
};
