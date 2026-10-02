const express = require("express");

const router = express.Router();

const {
  getBanners,
  getActiveBanners,
  addBanner,
} = require("../controllers/bannerController");

const uploadBanner = require("../middleware/uploadBanner");

// ======================================
// GET ALL BANNERS
// ======================================

router.get("/", getBanners);

// ======================================
// GET ACTIVE BANNERS
// ======================================

router.get("/active", getActiveBanners);

// ======================================
// ADD BANNER
// ======================================

router.post("/", uploadBanner.single("image"), addBanner);

module.exports = router;
