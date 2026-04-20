// models/alerteModel.js
// ✅ Utilise la table alerts du schema.sql
const pool = require('../config/database');

// ─────────────────────────────────────────────
// Récupère toutes les alertes actives
// Correspond à GET /api/alertes
// ─────────────────────────────────────────────
const getAllAlertes = async () => {
  const [rows] = await pool.execute(
    `SELECT
       a.alert_id       AS id_alerte,
       a.zone_id        AS id_segment,
       z.zone_name      AS nom_segment,
       a.alert_type     AS type_alerte,
       a.urgency_level  AS niveau,
       a.message,
       a.is_acked       AS est_acquittee,
       u.username       AS acquittee_par,
       a.acked_at       AS acquittee_le,
       a.created_at
     FROM alerts a
     LEFT JOIN coastal_zones z ON z.zone_id = a.zone_id
     LEFT JOIN users u ON u.user_id = a.acked_by
     WHERE a.is_acked = 0
     ORDER BY
       FIELD(a.urgency_level, 'CRITICAL', 'WARNING', 'INFO'),
       a.created_at DESC`
  );
  return rows;
};

// ─────────────────────────────────────────────
// Créer une alerte manuellement
// Correspond à POST /api/alertes
// ─────────────────────────────────────────────
const createAlerte = async (data) => {
  const { id_zone, type_alerte, niveau, message } = data;

  const [result] = await pool.execute(
    `INSERT INTO alerts (zone_id, alert_type, urgency_level, message)
     VALUES (?, ?, ?, ?)`,
    [
      id_zone || null,
      type_alerte || 'CRITICAL_RETREAT',
      (niveau || 'WARNING').toUpperCase(),
      message
    ]
  );

  return { id_alerte: result.insertId, ...data };
};

// ─────────────────────────────────────────────
// Acquitter une alerte (la marquer comme traitée)
// Correspond à PUT /api/alertes/:id/ack
// ─────────────────────────────────────────────
const acquitterAlerte = async (id_alerte, userId) => {
  const [result] = await pool.execute(
    `UPDATE alerts
     SET is_acked = 1, acked_by = ?, acked_at = NOW()
     WHERE alert_id = ?`,
    [userId, id_alerte]
  );
  return result.affectedRows > 0;
};

module.exports = { getAllAlertes, createAlerte, acquitterAlerte };
