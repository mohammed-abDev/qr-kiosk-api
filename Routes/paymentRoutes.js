const express = require("express");

const router = express.Router();

const {
  getPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} = require("../controllers/paymentController");

const protect = require("../middleware/authMiddleware");

// ==============================
// PUBLIC
// ==============================

// Customer gets active payment methods
router.get("/", getPaymentMethods);

// ==============================
// PROTECTED
// ==============================

// Admin adds payment method
router.post("/", protect, addPaymentMethod);

// Admin updates payment method
router.put("/:id", protect, updatePaymentMethod);

// Admin deletes payment method
router.delete("/:id", protect, deletePaymentMethod);

module.exports = router;
