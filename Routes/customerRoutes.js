const express = require("express");
const router = express.Router();

const {
  createCustomer,
  getCustomers,
} = require("../controllers/customerController");

const authMiddleware = require("../middleware/authMiddleware");

// All customer-management routes require login
router.post("/", authMiddleware, createCustomer);
router.get("/", authMiddleware, getCustomers);

module.exports = router;
