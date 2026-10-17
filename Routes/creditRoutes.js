const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createCreditTransaction,
  recordCreditPayment,
  getCustomerCreditHistory,
  getCreditNotifications,
} = require("../controllers/creditController");

// Record goods taken on credit
router.post("/transactions",authMiddleware,createCreditTransaction);

// Record customer repayment
router.post("/payments",authMiddleware,recordCreditPayment);

// Record customer history
router.get("/customers/:customerId/history",authMiddleware,getCustomerCreditHistory,
);

// Record customer Notifications
router.get("/notifications", authMiddleware, getCreditNotifications);


module.exports = router;

