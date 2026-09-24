const db = require("../db/dbConfige");

// GET all products
const getProducts = (req, res) => {
  const sql = `
        SELECT 
            products.id,
            products.shop_id,
            products.category_id,
            products.name,
            products.description,
            products.price,
            products.image,
            products.is_available,
            products.created_at,
            products.updated_at,
            categories.name AS category_name
        FROM products
        LEFT JOIN categories
            ON products.category_id = categories.id
        ORDER BY products.id DESC
    `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to get products",
        error: err.message,
      });
    }

    res.json(results);
  });
};

// GET one product
const getProductById = (req, res) => {
  const { id } = req.params;

  const sql = `
        SELECT 
            products.id,
            products.shop_id,
            products.category_id,
            products.name,
            products.description,
            products.price,
            products.image,
            products.is_available,
            categories.name AS category_name
        FROM products
        LEFT JOIN categories
            ON products.category_id = categories.id
        WHERE products.id = ?
    `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to get product",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json(results[0]);
  });
};

// CREATE product
const createProduct = (req, res) => {
  const { shop_id, category_id, name, description, price, is_available } =
    req.body;

  // Image path from Multer
  let image = null;

  if (req.file) {
    image = `/uploads/${req.file.filename}`;
  }

  const sql = `
        INSERT INTO products
        (shop_id, category_id, name, description, price, image, is_available)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

  db.query(
    sql,
    [
      shop_id,
      category_id || null,
      name,
      description || null,
      price,
      image,
      is_available,
    ],
    (err, result) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          message: "Failed to create product",
        });
      }

      res.status(201).json({
        message: "Product created successfully",
        productId: result.insertId,
        image: image,
      });
    },
  );
};

// UPDATE product
const updateProduct = (req, res) => {
  const { id } = req.params;

  const { category_id, name, description, price, is_available } = req.body;

  // If a new image was uploaded,
  // use the new image.
  // Otherwise keep the old image.
  if (req.file) {
    const image = `/uploads/${req.file.filename}`;

    const sql = `
        UPDATE products
        SET
            category_id = ?,
            name = ?,
            description = ?,
            price = ?,
            image = ?,
            is_available = ?
        WHERE id = ?
    `;

    db.query(
      sql,
      [
        category_id || null,
        name,
        description || null,
        price,
        image,
        is_available,
        id,
      ],
      (err, result) => {
        if (err) {
          console.error(err);

          return res.status(500).json({
            message: "Failed to update product",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Product not found",
          });
        }

        res.json({
          message: "Product updated successfully",
          image: image,
        });
      },
    );
  } else {
    // No new image.
    // Keep the existing image.

    const sql = `
        UPDATE products
        SET
            category_id = ?,
            name = ?,
            description = ?,
            price = ?,
            is_available = ?
        WHERE id = ?
    `;

    db.query(
      sql,
      [category_id || null, name, description || null, price, is_available, id],
      (err, result) => {
        if (err) {
          console.error(err);

          return res.status(500).json({
            message: "Failed to update product",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Product not found",
          });
        }

        res.json({
          message: "Product updated successfully",
        });
      },
    );
  }
};

// DELETE product
const deleteProduct = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM products WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to delete product",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({
      message: "Product deleted successfully",
    });
  });
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
