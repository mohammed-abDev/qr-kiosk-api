const db = require("../db/dbConfige");

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
const updateShop = (req, res) => {
  const { name } = req.body;

  let sql;
  let values;

  // New logo uploaded
  if (req.file) {
    const logo = `/uploads/${req.file.filename}`;

    sql = `
            UPDATE shops
            SET
                name = ?,
                logo = ?
            WHERE id = 1
        `;

    values = [name, logo];
  } else {
    // Keep existing logo
    sql = `
            UPDATE shops
            SET
                name = ?
            WHERE id = 1
        `;

    values = [name];
  }

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to update shop",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Shop not found",
      });
    }

    res.json({
      message: "Shop updated successfully",
      logo: req.file ? `/uploads/${req.file.filename}` : null,
    });
  });
};

module.exports = {
  getShop,
  updateShop,
};
