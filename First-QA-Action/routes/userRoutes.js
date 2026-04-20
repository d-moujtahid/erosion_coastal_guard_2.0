const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const ctrl = require("../controllers/userController");

router.get("/", authenticate, authorize("manage:users"), ctrl.getAll);
router.get("/roles", authenticate, authorize("manage:users"), ctrl.getRoles);
router.post("/", authenticate, authorize("manage:users"), ctrl.create);
router.put("/:id", authenticate, authorize("manage:users"), ctrl.update);
router.delete("/:id", authenticate, authorize("manage:users"), ctrl.remove);

module.exports = router;
