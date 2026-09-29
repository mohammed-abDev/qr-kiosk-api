const express = require("express");

const router = express.Router();

const { getShop, updateShop } = require("../controllers/shopController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");


// Public
router.get("/", getShop);

// Protected
router.put("/", protect, upload.single("logo"), updateShop);

module.exports = router;
