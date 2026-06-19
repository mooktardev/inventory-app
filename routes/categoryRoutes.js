const express = require("express");
const categoryController = require("../controllers/categoryController");
const { requireAdminPassword } = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", categoryController.list);
router.get("/create", categoryController.createGet);
router.post("/create", ...categoryController.createPost);
router.get("/:id", categoryController.detail);
router.get("/:id/update", categoryController.updateGet);
router.post(
  "/:id/update",
  requireAdminPassword,
  ...categoryController.updatePost
);
router.post(
  "/:id/delete",
  requireAdminPassword,
  categoryController.deletePost
);

module.exports = router;
