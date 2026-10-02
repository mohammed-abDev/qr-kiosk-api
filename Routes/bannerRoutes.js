const express = require("express");

const router = express.Router();

const {
  getBanners,
  getActiveBanners,
  addBanner,
  updateBanner,
  toggleBannerStatus,
  deleteBanner,
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

// ======================================
// EDIT BANNER IMAGE
// ======================================

router.put("/:id", uploadBanner.single("image"), updateBanner);

// ======================================
// ACTIVATE / DEACTIVATE BANNER
// ======================================

router.patch("/:id/status", toggleBannerStatus);

// ======================================
// DELETE BANNER
// ======================================

router.delete("/:id", deleteBanner);

module.exports = router;
