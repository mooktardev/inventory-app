const express = require("express");
const categoryController = require("../controllers/categoryController");

const router = express.Router();

router.get("/", categoryController.index);

module.exports = router;
