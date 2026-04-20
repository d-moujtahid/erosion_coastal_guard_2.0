const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const ctrl = require("../controllers/sensorController");

router.get("/", authenticate, authorize("read:mesures"), ctrl.getAll);
router.get("/:id", authenticate, authorize("read:mesures"), ctrl.getOne);

router.post("/", authenticate, authorize("write:mesures"), ctrl.create);
router.put("/:id", authenticate, authorize("write:mesures"), ctrl.update);
router.delete("/:id", authenticate, authorize("delete:all"), ctrl.remove);

module.exports = router;
