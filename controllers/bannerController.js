const { put, del } = require("@vercel/blob");
const db = require("../db/dbConfige");

// ======================================
// GET ALL BANNERS
// ======================================

const getBanners = (req, res) => {
  const sql = `
    SELECT
      id,
      image_url,
      is_active,
      sort_order,
      created_at,
      updated_at
    FROM banners
    ORDER BY sort_order ASC, id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get banners error:", err);

      return res.status(500).json({
        message: "Failed to get banners",
      });
    }

    res.json(results);
  });
};

// ======================================
// GET ACTIVE BANNERS
// ======================================

const getActiveBanners = (req, res) => {
  const sql = `
    SELECT
      id,
      image_url,
      sort_order
    FROM banners
    WHERE is_active = 1
    ORDER BY sort_order ASC, id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get active banners error:", err);

      return res.status(500).json({
        message: "Failed to get active banners",
      });
    }

    res.json(results);
  });
};

// ======================================
// ADD BANNER
// ======================================

const addBanner = async (req, res) => {
  try {
    // Check image
    if (!req.file) {
      return res.status(400).json({
        message: "Banner image is required",
      });
    }

    // Check Vercel Blob token
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        message: "Vercel Blob token is not configured",
      });
    }

    // Upload image to Vercel Blob
    const blob = await put(
      `banners/${Date.now()}-${req.file.originalname}`,
      req.file.buffer,
      {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: req.file.mimetype,
      },
    );

    // Get sort order
    const sortOrder = Number(req.body.sort_order) || 0;

    // Get active status
    const isActive = req.body.is_active === "false" ? 0 : 1;

    // Save only URL in TiDB
    const sql = `
      INSERT INTO banners
      (image_url, is_active, sort_order)
      VALUES (?, ?, ?)
    `;

    db.query(sql, [blob.url, isActive, sortOrder], (err, result) => {
      if (err) {
        console.error("Database banner error:", err);

        return res.status(500).json({
          message: "Banner uploaded but database save failed",
        });
      }

      res.status(201).json({
        message: "Banner added successfully",
        banner: {
          id: result.insertId,
          image_url: blob.url,
          is_active: isActive,
          sort_order: sortOrder,
        },
      });
    });
  } catch (error) {
    console.error("Add banner error:", error);

    res.status(500).json({
      message: "Failed to add banner",
      error: error.message,
    });
  }
};

module.exports = {
  getBanners,
  getActiveBanners,
  addBanner,
};
