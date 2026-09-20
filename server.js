require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db/dbConfige");

const app = express();

// ==============================
// MIDDLEWARE
// ==============================

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.use(express.json());

// ==============================
// UPLOADS
// ==============================

app.use("/uploads", express.static("uploads"));

// ==============================
// ROUTES
// ==============================

const productRoutes = require("./Routes/productRoutes");
const categoryRoutes = require("./Routes/categoryRoutes");
const authRoutes = require("./Routes/authRoutes");
const shopRoutes = require("./Routes/shopRoutes");
const paymentRoutes = require("./Routes/paymentRoutes");

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/payment-methods", paymentRoutes);

// ==============================
// HOME
// ==============================

app.get("/", (req, res) => {
  res.json({
    message: "Qr Kiosk API is running",
  });
});

// ==============================
// TEST DATABASE
// ==============================

app.get("/test-db", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        error: "Database query failed",
      });
    }

    res.json(results);
  });
});

// ==============================
// EXPORT APP
// ==============================

module.exports = app;