const db = require("../db/dbConfige");
const uploadToBlob = require("../utils/blobUpload");

// GET shop
const getShop = (req, res) => {
  const sql = `
    SELECT
      id,
      name,
      logo,
      qr_code,
      created_at
    FROM shops
    WHERE id = 1
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to get shop",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Shop not found",
      });
    }

    res.json(results[0]);
  });
};

// UPDATE shop
const updateShop = async (req, res) => {
  try {
    const { name } = req.body;

    // New logo uploaded
    if (req.file) {
      const logo = await uploadToBlob(req.file);

      const sql = `
        UPDATE shops
        SET
          name = ?,
          logo = ?
        WHERE id = 1
      `;

      db.query(sql, [name, logo], (err, result) => {
        if (err) {
          console.error(err);

          return res.status(500).json({
            message: "Failed to update shop",
            error: err.message,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Shop not found",
          });
        }

        res.json({
          message: "Shop updated successfully",
          logo,
        });
      });

      return;
    }

    // No new logo — keep existing logo
    const sql = `
      UPDATE shops
      SET
        name = ?
      WHERE id = 1
    `;

    db.query(sql, [name], (err, result) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          message: "Failed to update shop",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Shop not found",
        });
      }

      res.json({
        message: "Shop updated successfully",
      });
    });
  } catch (error) {
    console.error("Blob upload error:", error);

    res.status(500).json({
      message: "Failed to upload shop logo",
      error: error.message,
    });
  }
};

module.exports = {
  getShop,
  updateShop,
};
