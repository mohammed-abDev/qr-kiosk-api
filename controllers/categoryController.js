const db = require("../db/dbConfige");

// GET all categories
const getCategories = (req, res) => {
  const sql = `
        SELECT *
        FROM categories
        ORDER BY id DESC
    `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to get categories",
      });
    }

    res.json(results);
  });
};

// GET one category
const getCategoryById = (req, res) => {
  const { id } = req.params;

  const sql = `
        SELECT *
        FROM categories
        WHERE id = ?
    `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to get category",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    res.json(results[0]);
  });
};

// CREATE category
const createCategory = (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({
      message: "Category name is required",
    });
  }

  const sql = `
        INSERT INTO categories
        (name, description)
        VALUES (?, ?)
    `;

  db.query(sql, [name, description || null], (err, result) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to create category",
      });
    }

    res.status(201).json({
      message: "Category created successfully",
      categoryId: result.insertId,
    });
  });
};

// UPDATE category
const updateCategory = (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({
      message: "Category name is required",
    });
  }

  const sql = `
        UPDATE categories
        SET
            name = ?,
            description = ?
        WHERE id = ?
    `;

  db.query(sql, [name, description || null, id], (err, result) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to update category",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    res.json({
      message: "Category updated successfully",
    });
  });
};

// DELETE category
const deleteCategory = (req, res) => {
  const { id } = req.params;

  const sql = `
        DELETE FROM categories
        WHERE id = ?
    `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to delete category",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    res.json({
      message: "Category deleted successfully",
    });
  });
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
