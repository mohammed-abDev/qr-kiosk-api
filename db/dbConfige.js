const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),

  ssl: {
    minVersion: "TLSv1.2",
  },

  connectTimeout: 20000,
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed!");
    console.error(err.message);
    return;
  }

  console.log("TiDB database connected successfully!");
});

module.exports = db;
