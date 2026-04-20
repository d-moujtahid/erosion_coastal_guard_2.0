const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const ctrl = require("../controllers/permitController");

router.get("/", authenticate, authorize("read:segments"), ctrl.getAll);
router.get("/:id", authenticate, authorize("read:segments"), ctrl.getOne);

router.post("/", authenticate, authorize("write:mesures"), ctrl.create);
router.put("/:id/review", authenticate, authorize("write:all"), ctrl.review);

module.exports = router;
