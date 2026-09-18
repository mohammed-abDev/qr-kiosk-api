const express = require("express");
const multer = require("multer");

const router = express.Router();

const { getShop, updateShop } = require("../controllers/shopController");

const protect = require("../middleware/authMiddleware");

// Image storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "-");

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
});

// Public
router.get("/", getShop);

// Protected
router.put("/", protect, upload.single("logo"), updateShop);

module.exports = router;
