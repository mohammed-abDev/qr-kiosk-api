const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createCreditTransaction,
  recordCreditPayment,
  getCustomerCreditHistory,
} = require("../controllers/creditController");

// Record goods taken on credit
router.post("/transactions",authMiddleware,createCreditTransaction);

// Record customer repayment
router.post("/payments",authMiddleware,recordCreditPayment);

router.get("/customers/:customerId/history",authMiddleware,getCustomerCreditHistory,
);


module.exports = router;

