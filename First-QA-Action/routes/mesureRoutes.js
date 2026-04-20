// routes/mesureRoutes.js
const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const ctrl = require("../controllers/mesureController");

// Lecture des mesures GPS
router.get("/", authenticate, authorize("read:mesures"), ctrl.getAll);
router.get(
  "/:id_zone/historique",
  authenticate,
  authorize("read:mesures"),
  ctrl.getHistoriqueByZone,
);
router.get(
  "/:id_zone",
  authenticate,
  authorize("read:mesures"),
  ctrl.getByZone,
);

// Ajout d'une mesure terrain (scientist, super_admin)
router.post("/", authenticate, authorize("write:mesures"), ctrl.create);
router.post(
  "/historique",
  authenticate,
  authorize("write:mesures"),
  ctrl.createHistorique,
);

// Edition des mesures / historiques
router.put(
  "/points/:id_mesure",
  authenticate,
  authorize("write:mesures"),
  ctrl.update,
);
router.put(
  "/historique/:id_historique",
  authenticate,
  authorize("write:mesures"),
  ctrl.updateHistorique,
);

module.exports = router;
