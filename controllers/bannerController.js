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
    if (!req.file) {
      return res.status(400).json({
        message: "Banner image is required",
      });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        message: "Vercel Blob token is not configured",
      });
    }

    const blob = await put(
      `banners/${Date.now()}-${req.file.originalname}`,
      req.file.buffer,
      {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: req.file.mimetype,
      },
    );

    const sortOrder = Number(req.body.sort_order) || 0;

    const isActive = req.body.is_active === "false" ? 0 : 1;

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

// ======================================
// UPDATE BANNER IMAGE
// ======================================

const updateBanner = async (req, res) => {
  try {
    const bannerId = req.params.id;

    if (!req.file) {
      return res.status(400).json({
        message: "New banner image is required",
      });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        message: "Vercel Blob token is not configured",
      });
    }

    // Get existing banner
    const selectSql = `
      SELECT id, image_url
      FROM banners
      WHERE id = ?
    `;

    db.query(selectSql, [bannerId], async (err, results) => {
      if (err) {
        console.error("Find banner error:", err);

        return res.status(500).json({
          message: "Failed to find banner",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Banner not found",
        });
      }

      const oldImageUrl = results[0].image_url;

      // Upload new image
      const newBlob = await put(
        `banners/${Date.now()}-${req.file.originalname}`,
        req.file.buffer,
        {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
          contentType: req.file.mimetype,
        },
      );

      // Update database
      const updateSql = `
        UPDATE banners
        SET image_url = ?
        WHERE id = ?
      `;

      db.query(updateSql, [newBlob.url, bannerId], async (updateErr) => {
        if (updateErr) {
          console.error("Update banner database error:", updateErr);

          // Remove newly uploaded image if DB update fails
          try {
            await del(newBlob.url, {
              token: process.env.BLOB_READ_WRITE_TOKEN,
            });
          } catch (deleteError) {
            console.error("Failed to remove new Blob:", deleteError);
          }

          return res.status(500).json({
            message: "Failed to update banner",
          });
        }

        // Delete old image
        try {
          await del(oldImageUrl, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
        } catch (deleteError) {
          console.error("Failed to delete old banner image:", deleteError);
        }

        res.json({
          message: "Banner updated successfully",

          banner: {
            id: Number(bannerId),
            image_url: newBlob.url,
          },
        });
      });
    });
  } catch (error) {
    console.error("Update banner error:", error);

    res.status(500).json({
      message: "Failed to update banner",
      error: error.message,
    });
  }
};

// ======================================
// TOGGLE BANNER STATUS
// ======================================

const toggleBannerStatus = (req, res) => {
  const bannerId = req.params.id;

  const sql = `
    UPDATE banners
    SET is_active = IF(is_active = 1, 0, 1)
    WHERE id = ?
  `;

  db.query(sql, [bannerId], (err, result) => {
    if (err) {
      console.error("Toggle banner error:", err);

      return res.status(500).json({
        message: "Failed to update banner status",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Banner not found",
      });
    }

    res.json({
      message: "Banner status updated successfully",
    });
  });
};

// ======================================
// DELETE BANNER
// ======================================

const deleteBanner = async (req, res) => {
  try {
    const bannerId = req.params.id;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        message: "Vercel Blob token is not configured",
      });
    }

    // Find banner first
    const selectSql = `
      SELECT id, image_url
      FROM banners
      WHERE id = ?
    `;

    db.query(selectSql, [bannerId], async (err, results) => {
      if (err) {
        console.error("Find banner error:", err);

        return res.status(500).json({
          message: "Failed to find banner",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Banner not found",
        });
      }

      const imageUrl = results[0].image_url;

      // Delete database record
      const deleteSql = `
        DELETE FROM banners
        WHERE id = ?
      `;

      db.query(deleteSql, [bannerId], async (deleteErr) => {
        if (deleteErr) {
          console.error("Delete banner database error:", deleteErr);

          return res.status(500).json({
            message: "Failed to delete banner",
          });
        }

        // Delete image from Vercel Blob
        try {
          await del(imageUrl, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
        } catch (blobError) {
          console.error("Failed to delete banner image:", blobError);
        }

        res.json({
          message: "Banner deleted successfully",
        });
      });
    });
  } catch (error) {
    console.error("Delete banner error:", error);

    res.status(500).json({
      message: "Failed to delete banner",
      error: error.message,
    });
  }
};

// ======================================
// EXPORT
// ======================================

module.exports = {
  getBanners,
  getActiveBanners,
  addBanner,
  updateBanner,
  toggleBannerStatus,
  deleteBanner,
};
