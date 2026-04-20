const model = require("../models/sensorModel");
const { logAudit, getClientIp } = require("../models/auditLogModel");

const getAll = async (req, res) => {
  try {
    const data = await model.getAllSensors(req.query || {});
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error("[sensorController.getAll]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

const getOne = async (req, res) => {
  try {
    const sensor = await model.getSensorById(req.params.id);
    if (!sensor) {
      return res
        .status(404)
        .json({ success: false, message: "Capteur introuvable." });
    }
    return res.json({ success: true, data: sensor });
  } catch (err) {
    console.error("[sensorController.getOne]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

const create = async (req, res) => {
  try {
    const required = [
      "zone_id",
      "sensor_code",
      "latitude_install",
      "longitude_install",
      "install_date",
    ];
    for (const f of required) {
      if (!req.body[f]) {
        return res
          .status(400)
          .json({ success: false, message: `Champ requis : \"${f}\"` });
      }
    }

    const sensor = await model.createSensor(req.body);
    await logAudit({
      tableName: "gps_sensors",
      operation: "INSERT",
      recordId: sensor.sensor_id,
      fieldChanged: "sensor_create",
      oldValue: null,
      newValue: sensor,
      userId: req.user?.id || null,
      ipAddress: getClientIp(req),
    });

    return res.status(201).json({ success: true, data: sensor });
  } catch (err) {
    console.error("[sensorController.create]", err.message);
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ success: false, message: "Code capteur déjà existant." });
    }
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

const update = async (req, res) => {
  try {
    const before = await model.getSensorById(req.params.id);
    const ok = await model.updateSensor(req.params.id, req.body || {});
    if (!ok) {
      return res.status(404).json({
        success: false,
        message: "Capteur introuvable ou aucun champ à mettre à jour.",
      });
    }
    const fresh = await model.getSensorById(req.params.id);

    await logAudit({
      tableName: "gps_sensors",
      operation: "UPDATE",
      recordId: req.params.id,
      fieldChanged: "sensor_update",
      oldValue: before,
      newValue: fresh,
      userId: req.user?.id || null,
      ipAddress: getClientIp(req),
    });

    return res.json({ success: true, data: fresh });
  } catch (err) {
    console.error("[sensorController.update]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

const remove = async (req, res) => {
  try {
    const before = await model.getSensorById(req.params.id);
    const ok = await model.deleteSensor(req.params.id);
    if (!ok) {
      return res
        .status(404)
        .json({ success: false, message: "Capteur introuvable." });
    }

    await logAudit({
      tableName: "gps_sensors",
      operation: "DELETE",
      recordId: req.params.id,
      fieldChanged: "sensor_delete",
      oldValue: before,
      newValue: null,
      userId: req.user?.id || null,
      ipAddress: getClientIp(req),
    });

    return res.json({ success: true, message: "Capteur supprimé." });
  } catch (err) {
    console.error("[sensorController.remove]", err.message);
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        success: false,
        message:
          "Suppression impossible : ce capteur est référencé par des points GPS.",
      });
    }
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

module.exports = { getAll, getOne, create, update, remove };
