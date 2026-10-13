const db = require("../db/dbConfige");

// CREATE CUSTOMER
const createCustomer = async (req, res) => {
  try {
    const { name, phone, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        message: "Customer name and phone are required",
      });
    }

    const shopId = 1;

    // Check whether this phone number already exists in this shop
    const [existing] = await db
      .promise()
      .query("SELECT id FROM customers WHERE shop_id = ? AND phone = ?", [
        shopId,
        phone.trim(),
      ]);

    if (existing.length > 0) {
      return res.status(409).json({
        message: "A customer with this phone number already exists",
      });
    }

    const [result] = await db.promise().query(
      `INSERT INTO customers (shop_id, name, phone, notes)
       VALUES (?, ?, ?, ?)`,
      [shopId, name.trim(), phone.trim(), notes?.trim() || null],
    );

    return res.status(201).json({
      message: "Customer created successfully",
      customer: {
        id: result.insertId,
        shop_id: shopId,
        name: name.trim(),
        phone: phone.trim(),
        notes: notes?.trim() || null,
      },
    });
  } catch (error) {
    console.error("Create customer error:", error);
    return res.status(500).json({
      message: "Failed to create customer",
    });
  }
};

// GET ALL CUSTOMERS
const getCustomers = async (req, res) => {
  try {
    const shopId = 1;

    const [customers] = await db.promise().query(
      `SELECT
         c.id,
         c.shop_id,
         c.name,
         c.phone,
         c.notes,
         c.created_at,
         COALESCE(
           (SELECT SUM(ct.total_amount)
            FROM credit_transactions ct
            WHERE ct.customer_id = c.id
              AND ct.shop_id = c.shop_id),
           0
         ) -
         COALESCE(
           (SELECT SUM(cp.amount)
            FROM credit_payments cp
            WHERE cp.customer_id = c.id
              AND cp.shop_id = c.shop_id),
           0
         ) AS outstanding_balance
       FROM customers c
       WHERE c.shop_id = ?
       ORDER BY c.name ASC`,
      [shopId],
    );

    return res.status(200).json({
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);
    return res.status(500).json({
      message: "Failed to retrieve customers. Check your credit table columns.",
    });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
};
