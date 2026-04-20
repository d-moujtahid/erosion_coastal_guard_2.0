const bcrypt = require('bcryptjs');

const PASSWORD_HASH = bcrypt.hashSync('Test2025!', 12);

const roles = [
  { role_id: 1, role_name: 'super_admin', can_read: 1, can_write: 1, can_admin: 1, can_audit: 1 },
  { role_id: 2, role_name: 'scientist', can_read: 1, can_write: 1, can_admin: 0, can_audit: 0 },
  { role_id: 3, role_name: 'analyst', can_read: 1, can_write: 0, can_admin: 0, can_audit: 0 },
  { role_id: 4, role_name: 'operator', can_read: 1, can_write: 1, can_admin: 0, can_audit: 0 },
  { role_id: 5, role_name: 'viewer', can_read: 1, can_write: 0, can_admin: 0, can_audit: 0 }
];

const users = [
  { user_id: 1, role_id: 1, username: 'admin', email: 'admin@erosion.ma', password_hash: PASSWORD_HASH, is_active: 1, full_name: 'Admin Système' },
  { user_id: 2, role_id: 2, username: 'k.benali', email: 'scientist@erosion.ma', password_hash: PASSWORD_HASH, is_active: 1, full_name: 'Karim Benali' },
  { user_id: 3, role_id: 3, username: 's.ouahbi', email: 'analyst@erosion.ma', password_hash: PASSWORD_HASH, is_active: 1, full_name: 'Sara Ouahbi' },
  { user_id: 4, role_id: 4, username: 'm.ait', email: 'operator@erosion.ma', password_hash: PASSWORD_HASH, is_active: 1, full_name: 'Mohamed Ait' },
  { user_id: 5, role_id: 5, username: 'visiteur', email: 'viewer@erosion.ma', password_hash: PASSWORD_HASH, is_active: 1, full_name: 'Visiteur Public' }
];

const coastalZones = [
  { zone_id: 1, zone_name: 'Taghazout Nord', location: 'Taghazout', latitude_center: 30.5440, longitude_center: -9.7080, status: 'RED', area_km2: 2.1, description: 'Zone à recul critique — 47.3m en 10 ans', updated_at: '2026-04-13T00:00:00.000Z' },
  { zone_id: 2, zone_name: 'Taghazout Centre', location: 'Taghazout', latitude_center: 30.5250, longitude_center: -9.7000, status: 'RED', area_km2: 1.8, description: 'Zone à recul critique — 34.8m en 10 ans', updated_at: '2026-04-13T00:00:00.000Z' },
  { zone_id: 3, zone_name: 'Taghazout Sud', location: 'Taghazout', latitude_center: 30.5050, longitude_center: -9.6900, status: 'ORANGE', area_km2: 1.6, description: 'Zone en vigilance — 25.7m en 10 ans', updated_at: '2026-04-13T00:00:00.000Z' },
  { zone_id: 4, zone_name: 'Agadir Nord', location: 'Agadir', latitude_center: 30.4450, longitude_center: -9.6100, status: 'RED', area_km2: 3.2, description: 'Zone à recul critique — 38.1m en 10 ans', updated_at: '2026-04-13T00:00:00.000Z' },
  { zone_id: 5, zone_name: 'Agadir Centre', location: 'Agadir', latitude_center: 30.4200, longitude_center: -9.6050, status: 'ORANGE', area_km2: 2.6, description: 'Zone en vigilance — 31.5m en 10 ans', updated_at: '2026-04-13T00:00:00.000Z' },
  { zone_id: 6, zone_name: 'Agadir Sud', location: 'Agadir', latitude_center: 30.3900, longitude_center: -9.6200, status: 'GREEN', area_km2: 2.9, description: 'Zone stable — 7.4m en 10 ans', updated_at: '2026-04-13T00:00:00.000Z' }
];

const retreatMeasurements = [
  { zone_id: 1, lat_2016: 30.5412, lon_2016: -9.7098, lat_2026: 30.5384, lon_2026: -9.7095, years_difference: 10, total_distance_m: 47.3, annual_retreat_m: 4.73, computed_at: '2026-04-13T00:00:00.000Z' },
  { zone_id: 2, lat_2016: 30.5234, lon_2016: -9.7130, lat_2026: 30.5210, lon_2026: -9.7128, years_difference: 10, total_distance_m: 34.8, annual_retreat_m: 3.48, computed_at: '2026-04-13T00:00:00.000Z' },
  { zone_id: 3, lat_2016: 30.5124, lon_2016: -9.7155, lat_2026: 30.5106, lon_2026: -9.7153, years_difference: 10, total_distance_m: 25.7, annual_retreat_m: 2.57, computed_at: '2026-04-13T00:00:00.000Z' },
  { zone_id: 4, lat_2016: 30.4198, lon_2016: -9.6192, lat_2026: 30.4172, lon_2026: -9.6188, years_difference: 10, total_distance_m: 38.1, annual_retreat_m: 3.81, computed_at: '2026-04-13T00:00:00.000Z' },
  { zone_id: 5, lat_2016: 30.4024, lon_2016: -9.6228, lat_2026: 30.4002, lon_2026: -9.6224, years_difference: 10, total_distance_m: 31.5, annual_retreat_m: 3.15, computed_at: '2026-04-13T00:00:00.000Z' },
  { zone_id: 6, lat_2016: 30.3843, lon_2016: -9.6264, lat_2026: 30.3838, lon_2026: -9.6262, years_difference: 10, total_distance_m: 7.4, annual_retreat_m: 0.74, computed_at: '2026-04-13T00:00:00.000Z' }
];

const alerts = [
  { alert_id: 1, zone_id: 1, alert_type: 'CRITICAL_RETREAT', urgency_level: 'CRITICAL', message: 'CRITIQUE — Taghazout Nord : recul de 47.3m détecté (2016→2026). Taux annuel 4.73m/an. Intervention urgente requise.', is_acked: 0, acked_by: null, acked_at: null, created_at: '2026-04-13T00:00:00.000Z' },
  { alert_id: 2, zone_id: 4, alert_type: 'CRITICAL_RETREAT', urgency_level: 'CRITICAL', message: 'CRITIQUE — Agadir Nord : recul de 38.1m détecté (2016→2026). Taux annuel 3.81m/an.', is_acked: 0, acked_by: null, acked_at: null, created_at: '2026-04-13T00:00:00.000Z' },
  { alert_id: 3, zone_id: 2, alert_type: 'ZONE_RED_NEW', urgency_level: 'WARNING', message: 'VIGILANCE — Taghazout Centre : progression vers statut critique. Taux 3.48m/an.', is_acked: 0, acked_by: null, acked_at: null, created_at: '2026-04-13T00:00:00.000Z' }
];

const coastlinePoints = [
  { point_id: 1, zone_id: 1, latitude: 30.5384, longitude: -9.7095, altitude_m: 0, precision_m: 0.05, acquisition_method: 'DGPS', measured_by: 2, measurement_date: '2026-01-15', is_valid: 1, notes: null },
  { point_id: 2, zone_id: 2, latitude: 30.5210, longitude: -9.7128, altitude_m: 0, precision_m: 0.05, acquisition_method: 'DGPS', measured_by: 2, measurement_date: '2026-01-15', is_valid: 1, notes: null },
  { point_id: 3, zone_id: 3, latitude: 30.5106, longitude: -9.7153, altitude_m: 0, precision_m: 0.10, acquisition_method: 'GPS_terrain', measured_by: 4, measurement_date: '2026-01-22', is_valid: 1, notes: null },
  { point_id: 4, zone_id: 4, latitude: 30.4172, longitude: -9.6188, altitude_m: 0, precision_m: 0.05, acquisition_method: 'DGPS', measured_by: 3, measurement_date: '2026-02-01', is_valid: 1, notes: null },
  { point_id: 5, zone_id: 5, latitude: 30.4002, longitude: -9.6224, altitude_m: 0, precision_m: 0.10, acquisition_method: 'GPS_terrain', measured_by: 3, measurement_date: '2026-02-01', is_valid: 1, notes: null },
  { point_id: 6, zone_id: 6, latitude: 30.3838, longitude: -9.6262, altitude_m: 0, precision_m: 0.10, acquisition_method: 'GPS_terrain', measured_by: 4, measurement_date: '2026-02-10', is_valid: 1, notes: null }
];

const coastlineHistory = [
  { history_id: 1, zone_id: 1, latitude: 30.5412, longitude: -9.7098, reference_year: 2016, source: 'IGN Maroc 2016', recorded_by: 1 },
  { history_id: 2, zone_id: 2, latitude: 30.5234, longitude: -9.7130, reference_year: 2016, source: 'IGN Maroc 2016', recorded_by: 1 },
  { history_id: 3, zone_id: 3, latitude: 30.5124, longitude: -9.7155, reference_year: 2016, source: 'Landsat 8 2016', recorded_by: 1 },
  { history_id: 4, zone_id: 4, latitude: 30.4198, longitude: -9.6192, reference_year: 2016, source: 'IGN Maroc 2016', recorded_by: 1 },
  { history_id: 5, zone_id: 5, latitude: 30.4024, longitude: -9.6228, reference_year: 2016, source: 'Landsat 8 2016', recorded_by: 1 },
  { history_id: 6, zone_id: 6, latitude: 30.3843, longitude: -9.6264, reference_year: 2016, source: 'Landsat 8 2016', recorded_by: 1 }
];

const clone = (value) => JSON.parse(JSON.stringify(value));

const getRoleById = (roleId) => roles.find((role) => role.role_id === roleId) || null;

const buildLoginRow = (email) => {
  const user = users.find((entry) => entry.email === email && entry.is_active === 1);
  if (!user) return [];
  const role = getRoleById(user.role_id);
  return [{
    user_id: user.user_id,
    email: user.email,
    username: user.username,
    full_name: user.full_name,
    password_hash: user.password_hash,
    is_active: user.is_active,
    role_name: role.role_name,
    can_read: role.can_read,
    can_write: role.can_write,
    can_admin: role.can_admin,
    can_audit: role.can_audit
  }];
};

const buildSegments = () => coastalZones.map((zone) => {
  const measurement = retreatMeasurements.find((entry) => entry.zone_id === zone.zone_id) || null;
  const pointCount = coastlinePoints.filter((entry) => entry.zone_id === zone.zone_id).length;

  return {
    id_segment: zone.zone_id,
    nom_segment: zone.zone_name,
    zone_geographique: zone.location,
    latitude_debut: zone.latitude_center,
    longitude_debut: zone.longitude_center,
    status: zone.status,
    statut_erosion: zone.status === 'RED' ? 'critique' : zone.status === 'ORANGE' ? 'modere' : 'stable',
    area_km2: zone.area_km2,
    updated_at: zone.updated_at,
    nb_mesures: pointCount,
    taux_recul_annuel: measurement ? measurement.annual_retreat_m : null,
    recul_total_m: measurement ? measurement.total_distance_m : null
  };
});

const buildSegmentById = (id) => buildSegments().find((entry) => entry.id_segment === id) || null;

const buildRecul = (id) => {
  const zone = coastalZones.find((entry) => entry.zone_id === id);
  const measurement = retreatMeasurements.find((entry) => entry.zone_id === id);
  if (!zone || !measurement) return null;
  return {
    id_segment: id,
    nom_segment: zone.zone_name,
    lat_2016: measurement.lat_2016,
    lon_2016: measurement.lon_2016,
    lat_2026: measurement.lat_2026,
    lon_2026: measurement.lon_2026,
    recul_m: measurement.total_distance_m,
    taux_annuel: measurement.annual_retreat_m,
    periode_ans: measurement.years_difference,
    computed_at: measurement.computed_at
  };
};

const buildMesures = (limit = 50) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
  const rows = coastlinePoints
    .slice()
    .sort((left, right) => new Date(right.measurement_date) - new Date(left.measurement_date))
    .slice(0, safeLimit)
    .map((point) => {
      const zone = coastalZones.find((entry) => entry.zone_id === point.zone_id);
      const user = users.find((entry) => entry.user_id === point.measured_by);
      return {
        id_mesure: point.point_id,
        id_segment: point.zone_id,
        nom_segment: zone ? zone.zone_name : null,
        latitude: point.latitude,
        longitude: point.longitude,
        measurement_date: point.measurement_date,
        date_mesure: point.measurement_date,
        operateur: user ? user.username : null
      };
    });

  return rows;
};

const buildMesuresByZone = (idZone) => coastlinePoints
  .filter((point) => point.zone_id === idZone && point.is_valid === 1)
  .sort((left, right) => new Date(right.measurement_date) - new Date(left.measurement_date))
  .map((point) => {
    const zone = coastalZones.find((entry) => entry.zone_id === point.zone_id);
    const user = users.find((entry) => entry.user_id === point.measured_by);
    return {
      id_mesure: point.point_id,
      id_segment: point.zone_id,
      nom_segment: zone ? zone.zone_name : null,
      latitude: point.latitude,
      longitude: point.longitude,
      altitude_m: point.altitude_m,
      precision_m: point.precision_m,
      methode: point.acquisition_method,
      date_mesure: point.measurement_date,
      operateur: user ? user.username : null,
      notes: point.notes
    };
  });

const buildAlertes = () => alerts
  .filter((alert) => alert.is_acked === 0)
  .slice()
  .sort((left, right) => {
    const order = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    return order[left.urgency_level] - order[right.urgency_level] || new Date(right.created_at) - new Date(left.created_at);
  })
  .map((alert) => {
    const zone = coastalZones.find((entry) => entry.zone_id === alert.zone_id);
    const user = users.find((entry) => entry.user_id === alert.acked_by);
    return {
      id_alerte: alert.alert_id,
      id_segment: alert.zone_id,
      nom_segment: zone ? zone.zone_name : null,
      type_alerte: alert.alert_type,
      niveau: alert.urgency_level,
      message: alert.message,
      est_acquittee: alert.is_acked,
      acquittee_par: user ? user.username : null,
      acquittee_le: alert.acked_at,
      created_at: alert.created_at
    };
  });

const demoPool = {
  async getConnection() {
    return { release() {} };
  },

  async execute(query, params = []) {
    const normalizedQuery = String(query).replace(/\s+/g, ' ').trim().toLowerCase();

    if (normalizedQuery.startsWith('select u.user_id') && normalizedQuery.includes('from users u join roles r on u.role_id = r.role_id where u.email = ?')) {
      return [buildLoginRow(String(params[0]).trim().toLowerCase())];
    }

    if (normalizedQuery.startsWith('update users set last_login = now() where user_id = ?')) {
      return [{ affectedRows: 1 }];
    }

    if (normalizedQuery.includes('from coastal_zones z') && normalizedQuery.includes('left join coastline_points cp on cp.zone_id = z.zone_id') && normalizedQuery.includes('left join retreat_measurements rm on rm.zone_id = z.zone_id')) {
      let rows = buildSegments();
      const zoneFilter = params[0];
      const statusFilter = params[1];
      if (normalizedQuery.includes('where z.location = ?')) {
        rows = rows.filter((entry) => entry.zone_geographique === zoneFilter);
      }
      if (normalizedQuery.includes('where z.status = ?') || normalizedQuery.includes('and z.status = ?')) {
        rows = rows.filter((entry) => entry.status === statusFilter);
      }
      return [rows];
    }

    if (normalizedQuery.includes('from coastal_zones z where z.zone_id = ? limit 1')) {
      return [buildSegmentById(Number(params[0])) ? [buildSegmentById(Number(params[0]))] : []];
    }

    if (normalizedQuery.includes('from retreat_measurements rm join coastal_zones z on z.zone_id = rm.zone_id where rm.zone_id = ? order by rm.computed_at desc limit 1')) {
      const row = buildRecul(Number(params[0]));
      return [row ? [row] : []];
    }

    if (normalizedQuery.includes('from coastline_history ch join coastline_points cp on cp.zone_id = ch.zone_id where ch.zone_id = ? and ch.reference_year = 2016')) {
      const row = buildRecul(Number(params[0]));
      if (!row) return [[]];
      return [[{
        lat_2016: row.lat_2016,
        lon_2016: row.lon_2016,
        lat_2026: row.lat_2026,
        lon_2026: row.lon_2026,
        recul_m: row.recul_m
      }]];
    }

    if (normalizedQuery.startsWith('insert into coastal_zones')) {
      return [{ insertId: coastalZones.length + 1 }];
    }

    if (normalizedQuery.startsWith('insert into coastline_points')) {
      return [{ insertId: coastlinePoints.length + 1 }];
    }

    if (normalizedQuery.startsWith('insert into alerts')) {
      return [{ insertId: alerts.length + 1 }];
    }

    if (normalizedQuery.startsWith('update alerts set is_acked = 1, acked_by = ?, acked_at = now() where alert_id = ?')) {
      return [{ affectedRows: alerts.some((alert) => alert.alert_id === Number(params[1])) ? 1 : 0 }];
    }

    if (normalizedQuery.startsWith('select') && normalizedQuery.includes('from coastline_points cp join coastal_zones z on z.zone_id = cp.zone_id left join users u on u.user_id = cp.measured_by where cp.zone_id = ? and cp.is_valid = 1 order by cp.measurement_date desc')) {
      return [buildMesuresByZone(Number(params[0]))];
    }

    if (normalizedQuery.startsWith('select') && normalizedQuery.includes('from coastline_points cp join coastal_zones z on z.zone_id = cp.zone_id left join users u on u.user_id = cp.measured_by where cp.is_valid = 1 order by cp.measurement_date desc limit')) {
      const limitMatch = normalizedQuery.match(/limit\s+(\d+)/);
      const limit = limitMatch ? Number(limitMatch[1]) : params[0];
      return [buildMesures(limit)];
    }

    if (normalizedQuery.startsWith('select') && normalizedQuery.includes('from alerts a left join coastal_zones z on z.zone_id = a.zone_id left join users u on u.user_id = a.acked_by where a.is_acked = 0 order by')) {
      return [buildAlertes()];
    }

    if (normalizedQuery.startsWith('update users set last_login = now() where user_id = ?')) {
      return [{ affectedRows: 1 }];
    }

    return [[]];
  }
};

module.exports = {
  demoPool,
  demoData: {
    roles: clone(roles),
    users: clone(users),
    coastalZones: clone(coastalZones),
    retreatMeasurements: clone(retreatMeasurements),
    alerts: clone(alerts),
    coastlinePoints: clone(coastlinePoints),
    coastlineHistory: clone(coastlineHistory)
  }
};