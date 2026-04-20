const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const ctrl = require("../controllers/auditController");

// Lecture seule des journaux d'audit
router.get("/", authenticate, authorize("view:audit"), ctrl.getRecent);

module.exports = router;
