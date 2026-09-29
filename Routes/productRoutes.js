const express = require("express");

const router = express.Router();

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Public routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Protected routes
router.post("/", protect, upload.single("image"), createProduct);

router.put("/:id", protect, upload.single("image"), updateProduct);

router.delete("/:id", protect, deleteProduct);

module.exports = router;
