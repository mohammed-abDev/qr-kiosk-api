require("dotenv").config();
const express  = require("express");
const app = express();
const cors = require("cors");
const db = require("./db/dbConfige");
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());
app.use("/uploads", express.static("uploads"));

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

app.get("/", (req, res) => {
    res.json({
        message: "Qr Kiosk API is running"
    });
});


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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
