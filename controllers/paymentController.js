const db = require("../db/dbConfige");

// ==============================
// GET PAYMENT METHODS
// ==============================

const getPaymentMethods = (req, res) => {
  const sql = `
    SELECT
      id,
      bank_name,
      account_name,
      account_number,
      is_active
    FROM payment_methods
    WHERE is_active = 1
    ORDER BY id ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Payment methods error:", err);

      return res.status(500).json({
        message: "Failed to get payment methods",
      });
    }

    res.json(results);
  });
};

// ==============================
// ADD PAYMENT METHOD
// ==============================

const addPaymentMethod = (req, res) => {
  const { bank_name, account_name, account_number } = req.body;

  if (!bank_name || !account_name || !account_number) {
    return res.status(400).json({
      message: "All payment information is required",
    });
  }

  const sql = `
    INSERT INTO payment_methods
    (bank_name, account_name, account_number)
    VALUES (?, ?, ?)
  `;

  const values = [bank_name, account_name, account_number];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Add payment method error:", err);

      return res.status(500).json({
        message: "Failed to add payment method",
      });
    }

    res.status(201).json({
      message: "Payment method added successfully",
      id: result.insertId,
    });
  });
};

// ==============================
// UPDATE PAYMENT METHOD
// ==============================

const updatePaymentMethod = (req, res) => {
  const { id } = req.params;

  const {
    bank_name,
    account_name,
    account_number,
  } = req.body;

  if (!bank_name || !account_name || !account_number) {
    return res.status(400).json({
      message: "All payment information is required",
    });
  }

  const sql = `
    UPDATE payment_methods
    SET
      bank_name = ?,
      account_name = ?,
      account_number = ?
    WHERE id = ?
  `;

  const values = [
    bank_name,
    account_name,
    account_number,
    id,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error(
        "Update payment method error:",
        err
      );

      return res.status(500).json({
        message: "Failed to update payment method",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Payment method not found",
      });
    }

    res.json({
      message:
        "Payment method updated successfully",
    });
  });
};

// ==============================
// DELETE PAYMENT METHOD
// ==============================

const deletePaymentMethod = (req, res) => {
  const { id } = req.params;

  const sql = `
    DELETE FROM payment_methods
    WHERE id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Delete payment method error:", err);

      return res.status(500).json({
        message: "Failed to delete payment method",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Payment method not found",
      });
    }

    res.json({
      message: "Payment method deleted successfully",
    });
  });
};

module.exports = {
  getPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};
