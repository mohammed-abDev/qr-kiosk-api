const express = require("express");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

router.get("/", getCategories);

router.get("/:id", getCategoryById);

router.post("/", protect, createCategory);

router.put("/:id", protect, updateCategory);

router.delete("/:id", protect, deleteCategory);

module.exports = router;
