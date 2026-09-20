const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: Number(process.env.DB_PORT || 4000),
  ssl:
    process.env.TIDB_ENABLE_SSL === "true"
      ? {
          minVersion: "TLSv1.2",
        }
      : undefined,
});




// db.connect((err) => {
//     if (err) {
//         console.error(" Database connection failed!");
//         console.error(err.message);
//         return;
//     }

//     console.log(" MySQL database connected successfully!");
// });

module.exports = db;