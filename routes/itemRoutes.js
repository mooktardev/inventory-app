const express = require("express");
const itemController = require("../controllers/itemController");
const { requireAdminPassword } = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", itemController.list);
router.get("/create", itemController.createGet);
router.post("/create", ...itemController.createPost);
router.get("/:id", itemController.detail);
router.get("/:id/update", itemController.updateGet);
router.post("/:id/update", requireAdminPassword, ...itemController.updatePost);
router.post("/:id/delete", requireAdminPassword, itemController.deletePost);

module.exports = router;
