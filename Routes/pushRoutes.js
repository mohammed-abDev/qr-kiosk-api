const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  savePushSubscription,
  sendTestPush,
} = require("../controllers/pushController");

router.post("/subscribe", authMiddleware, savePushSubscription);

router.post("/test", authMiddleware, sendTestPush);

module.exports = router;
