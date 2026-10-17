const db = require("../db/dbConfige");

// CREATE A CREDIT PURCHASE
const createCreditTransaction = async (req, res) => {
    console.log("TEST: createCreditTransaction was called");
  let connection;
  

  try {
    const { customer_id, items, notes } = req.body;

    // Your current shop ID
    const shopId = 1;

    // Get the logged-in user's ID from the JWT middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!customer_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Customer ID and at least one product are required",
      });
    }

    // Validate customer ID
    if (
      !Number.isSafeInteger(Number(customer_id)) ||
      Number(customer_id) <= 0
    ) {
      return res.status(400).json({
        message: "Invalid customer ID",
      });
    }

    // Validate every product and quantity
    for (const item of items) {
      if (
        !Number.isSafeInteger(Number(item.product_id)) ||
        Number(item.product_id) <= 0 ||
        !Number.isSafeInteger(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        return res.status(400).json({
          message:
            "Every item needs a valid product ID and positive whole-number quantity",
        });
      }
    }

    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // Confirm customer belongs to this shop
    const [customers] = await connection.query(
      `SELECT id, name, phone
       FROM customers
       WHERE id = ? AND shop_id = ?`,
      [customer_id, shopId],
    );

    if (customers.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Customer not found in this shop",
      });
    }

    let totalAmount = 0;
    const transactionItems = [];

    // Read prices from the database, never trust prices sent by Postman
    for (const item of items) {
      const [products] = await connection.query(
        `SELECT id, name, price
         FROM products
         WHERE id = ?
           AND shop_id = ?
           AND is_available = 1`,
        [item.product_id, shopId],
      );

      if (products.length === 0) {
        await connection.rollback();

        return res.status(400).json({
          message: `Product ID ${item.product_id} was not found, or is unavailable`,
        });
      }

      const product = products[0];
      const quantity = Number(item.quantity);
      const unitPrice = Number(product.price);
      const lineTotal = Math.round(unitPrice * quantity * 100) / 100;

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error("Invalid product price in database");
      }

      totalAmount += lineTotal;

      transactionItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
      });
    }

    totalAmount = Math.round(totalAmount * 100) / 100;

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      await connection.rollback();

      return res.status(400).json({
        message: "The credit purchase total must be greater than zero",
      });
    }

    // Save the main transaction
    const [transactionResult] = await connection.query(
      `INSERT INTO credit_transactions
       (shop_id, customer_id, created_by, total_amount, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        shopId,
        Number(customer_id),
        userId,
        totalAmount,
        typeof notes === "string" ? notes.trim() || null : null,
      ],
    );

    const transactionId = transactionResult.insertId;

    // Save every product in this purchase
    for (const item of transactionItems) {
      await connection.query(
        `INSERT INTO credit_transaction_items
         (transaction_id, product_id, product_name,
          quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          item.product_id,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.line_total,
        ],
      );
    }

    // Commit only when the transaction and all items are saved
    // await connection.commit();

    // Create admin dashboard notification
    const saleMessage =
      `${customers[0].name} received goods on credit: ` +
      `${totalAmount.toFixed(2)} ETB.`;

    const [adminNotificationResult] = await connection.query(
      `INSERT INTO credit_notifications
   (
     shop_id,
     customer_id,
     transaction_id,
     recipient_type,
     channel,
     message,
     status,
     sent_at
   )
   VALUES (?, ?, ?, 'admin', 'dashboard', ?, 'sent', CURRENT_TIMESTAMP)`,
      [shopId, Number(customer_id), transactionId, saleMessage],
    );

    // Queue customer SMS for future delivery
    const saleSmsMessage =
      `Abdu Mart: Credit recorded: ${totalAmount.toFixed(2)} ETB. ` +
      `Please contact the shop if you have questions.`;

    // Save SMS as pending because no SMS provider is connected yet
    await connection.query(
      `INSERT INTO credit_notifications
   (
     shop_id,
     customer_id,
     transaction_id,
     recipient_type,
     channel,
     recipient_phone,
     message,
     status
   )
   VALUES (?, ?, ?, 'customer', 'sms', ?, ?, 'pending')`,
      [
        shopId,
        Number(customer_id),
        transactionId,
        customers[0].phone,
        saleSmsMessage,
      ],
    );

    // Save purchase and notifications together
    await connection.commit();

   // Broadcast only after the database transaction succeeds
const io = req.app.get("io");

console.log("CREDIT SALE: Database transaction committed");
console.log("CREDIT SALE: Socket.IO available:", Boolean(io));

if (io) {
  console.log("CREDIT SALE: Broadcasting notification:", saleMessage);
  console.log("CREDIT SALE: Connected clients:", io.engine.clientsCount);

  io.emit("credit:notification", {
    id: adminNotificationResult.insertId,
    type: "credit_sale",
    customerId: Number(customer_id),
    transactionId,
    customerName: customers[0].name,
    amount: totalAmount.toFixed(2),
    message: saleMessage,
    createdAt: new Date().toISOString(),
  });
}

    return res.status(201).json({
      message: "Credit purchase recorded successfully",
      transaction: {
        id: transactionId,
        shop_id: shopId,
        customer_id: Number(customer_id),
        customer_name: customers[0].name,
        created_by: userId,
        total_amount: totalAmount.toFixed(2),
        notes: typeof notes === "string" ? notes.trim() || null : null,
        items: transactionItems,
      },
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Credit transaction rollback error:", rollbackError);
      }
    }

    console.error("Create credit transaction error:", error);

    return res.status(500).json({
      message: "Failed to record credit purchase",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const recordCreditPayment = async (req, res) => {
  let connection;

  try {
    const { customer_id, amount, notes } = req.body;
    const shopId = 1;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (
      !Number.isSafeInteger(Number(customer_id)) ||
      Number(customer_id) <= 0
    ) {
      return res.status(400).json({
        message: "A valid customer ID is required",
      });
    }

    // Accept positive amounts with at most two decimal places
    if (
      !/^\d+(\.\d{1,2})?$/.test(String(amount)) ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        message: "Enter a valid payment amount greater than zero",
      });
    }

    if (notes != null && (typeof notes !== "string" || notes.length > 500)) {
      return res.status(400).json({
        message: "Notes must be text with at most 500 characters",
      });
    }

    const paymentCents = Math.round(Number(amount) * 100);

    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // Lock the customer row while checking and recording repayment
    const [customers] = await connection.query(
      `SELECT id, name, phone
       FROM customers
       WHERE id = ? AND shop_id = ?
       FOR UPDATE`,
      [Number(customer_id), shopId],
    );

    if (customers.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Customer not found in this shop",
      });
    }

    // Calculate total credit purchases
    const [purchaseRows] = await connection.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total_credit
       FROM credit_transactions
       WHERE customer_id = ? AND shop_id = ?`,
      [Number(customer_id), shopId],
    );

    // Calculate repayments already recorded
    const [paymentRows] = await connection.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid
       FROM credit_payments
       WHERE customer_id = ? AND shop_id = ?`,
      [Number(customer_id), shopId],
    );

    const totalCreditCents = Math.round(
      Number(purchaseRows[0].total_credit) * 100,
    );

    const totalPaidCents = Math.round(Number(paymentRows[0].total_paid) * 100);

    const outstandingCents = totalCreditCents - totalPaidCents;

    if (outstandingCents <= 0) {
      await connection.rollback();

      return res.status(400).json({
        message: "This customer has no outstanding debt",
      });
    }

    if (paymentCents > outstandingCents) {
      await connection.rollback();

      return res.status(400).json({
        message: "Payment exceeds the outstanding balance",
        outstanding_balance: (outstandingCents / 100).toFixed(2),
      });
    }

    // Save the repayment
    const [result] = await connection.query(
      `INSERT INTO credit_payments
       (shop_id, customer_id, amount, received_by, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        shopId,
        Number(customer_id),
        (paymentCents / 100).toFixed(2),
        userId,
        notes?.trim() || null,
      ],
    );

    const remainingCents = outstandingCents - paymentCents;

    // Create admin dashboard notification
    const paymentMessage =
      `${customers[0].name} repaid ${(paymentCents / 100).toFixed(2)} ETB. ` +
      `Remaining balance: ${(remainingCents / 100).toFixed(2)} ETB.`;

    const [adminNotificationResult] = await connection.query(
      `INSERT INTO credit_notifications
   (
     shop_id,
     customer_id,
     payment_id,
     recipient_type,
     channel,
     message,
     status,
     sent_at
   )
   VALUES (?, ?, ?, 'admin', 'dashboard', ?, 'sent', CURRENT_TIMESTAMP)`,
      [shopId, Number(customer_id), result.insertId, paymentMessage],
    );

    // Queue customer SMS for future delivery
    const paymentSmsMessage =
      `Abdu Mart: Payment received: ${(paymentCents / 100).toFixed(2)} ETB. ` +
      `Remaining balance: ${(remainingCents / 100).toFixed(2)} ETB.`;

    // Save SMS as pending until an SMS provider is connected
    await connection.query(
      `INSERT INTO credit_notifications
   (
     shop_id,
     customer_id,
     payment_id,
     recipient_type,
     channel,
     recipient_phone,
     message,
     status
   )
   VALUES (?, ?, ?, 'customer', 'sms', ?, ?, 'pending')`,
      [
        shopId,
        Number(customer_id),
        result.insertId,
        customers[0].phone,
        paymentSmsMessage,
      ],
    );

    // Commit repayment and notifications together
    await connection.commit();

    // Broadcast repayment notification after successful commit
    const io = req.app.get("io");
    console.log("REPAYMENT: Database transaction committed");
    console.log("REPAYMENT: Socket.IO available:", Boolean(io));


    if (io) {
    console.log("REPAYMENT: Broadcasting notification:", paymentMessage);
      io.emit("credit:notification", {
        id: adminNotificationResult.insertId,
        type: "repayment",
        customerId: Number(customer_id),
        paymentId: result.insertId,
        customerName: customers[0].name,
        amount: (paymentCents / 100).toFixed(2),
        remainingBalance: (remainingCents / 100).toFixed(2),
        message: paymentMessage,
        createdAt: new Date().toISOString(),
      });
    }

    return res.status(201).json({
      message: "Customer repayment recorded successfully",
      payment: {
        id: result.insertId,
        customer_id: Number(customer_id),
        customer_name: customers[0].name,
        amount: (paymentCents / 100).toFixed(2),
        received_by: userId,
        notes: notes?.trim() || null,
      },
      total_credit: (totalCreditCents / 100).toFixed(2),
      total_paid: ((totalPaidCents + paymentCents) / 100).toFixed(2),
      outstanding_balance: (remainingCents / 100).toFixed(2),
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Payment rollback error:", rollbackError);
      }
    }

    console.error("Record credit payment error:", error);

    return res.status(500).json({
      message: "Failed to record customer repayment",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getCustomerCreditHistory = async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    const shopId = 1;

    if (!Number.isSafeInteger(customerId) || customerId <= 0) {
      return res.status(400).json({
        message: "Invalid customer ID",
      });
    }

    // Find the customer
    const [customers] = await db.promise().query(
      `SELECT id, shop_id, name, phone, notes, created_at
       FROM customers
       WHERE id = ? AND shop_id = ?`,
      [customerId, shopId],
    );

    if (customers.length === 0) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    // Get all credit purchases
    const [transactions] = await db.promise().query(
      `SELECT id, total_amount, notes, created_at
       FROM credit_transactions
       WHERE customer_id = ? AND shop_id = ?
       ORDER BY created_at DESC, id DESC`,
      [customerId, shopId],
    );

    // Get all repayments
    const [payments] = await db.promise().query(
      `SELECT id, amount, notes, received_by, created_at
       FROM credit_payments
       WHERE customer_id = ? AND shop_id = ?
       ORDER BY created_at DESC, id DESC`,
      [customerId, shopId],
    );

    // Get product details for all purchases
    let items = [];

    if (transactions.length > 0) {
      const transactionIds = transactions.map((transaction) => transaction.id);
      const placeholders = transactionIds.map(() => "?").join(", ");

      const [rows] = await db.promise().query(
        `SELECT transaction_id, product_id, product_name,
                quantity, unit_price, line_total
         FROM credit_transaction_items
         WHERE transaction_id IN (${placeholders})
         ORDER BY transaction_id DESC, product_name ASC`,
        transactionIds,
      );

      items = rows;
    }

    // Attach products to their respective purchases
    const purchasesWithItems = transactions.map((transaction) => ({
      ...transaction,
      total_amount: Number(transaction.total_amount).toFixed(2),
      items: items
        .filter(
          (item) => String(item.transaction_id) === String(transaction.id),
        )
        .map((item) => ({
          ...item,
          unit_price: Number(item.unit_price).toFixed(2),
          line_total: Number(item.line_total).toFixed(2),
        })),
    }));

    const totalCreditCents = transactions.reduce(
      (sum, transaction) =>
        sum + Math.round(Number(transaction.total_amount) * 100),
      0,
    );

    const totalPaidCents = payments.reduce(
      (sum, payment) => sum + Math.round(Number(payment.amount) * 100),
      0,
    );

    // Combine purchases and repayments into one timeline
    const history = [
      ...purchasesWithItems.map((transaction) => ({
        type: "credit",
        id: transaction.id,
        amount: transaction.total_amount,
        notes: transaction.notes,
        created_at: transaction.created_at,
        items: transaction.items,
      })),
      ...payments.map((payment) => ({
        type: "payment",
        id: payment.id,
        amount: Number(payment.amount).toFixed(2),
        notes: payment.notes,
        received_by: payment.received_by,
        created_at: payment.created_at,
      })),
    ].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ||
        String(b.id).localeCompare(String(a.id), undefined, {
          numeric: true,
        }),
    );

    return res.status(200).json({
      customer: customers[0],
      summary: {
        total_credit: (totalCreditCents / 100).toFixed(2),
        total_paid: (totalPaidCents / 100).toFixed(2),
        outstanding_balance: (
          (totalCreditCents - totalPaidCents) /
          100
        ).toFixed(2),
      },
      total_purchases: transactions.length,
      total_payments: payments.length,
      purchases: purchasesWithItems,
      payments,
      history,
    });
  } catch (error) {
    console.error("Get customer credit history error:", error);

    return res.status(500).json({
      message: "Failed to retrieve customer credit history",
    });
  }
};

// GET ADMIN CREDIT NOTIFICATIONS
const getCreditNotifications = async (req, res) => {
  try {
    // Only admins can view these notifications
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can view credit notifications",
      });
    }

    const shopId = 1;

    const [notifications] = await db.promise().query(
      `SELECT
         id,
         customer_id,
         transaction_id,
         payment_id,
         message,
         status,
         created_at
       FROM credit_notifications
       WHERE shop_id = ?
         AND recipient_type = 'admin'
         AND channel = 'dashboard'
       ORDER BY created_at DESC, id DESC
       LIMIT 50`,
      [shopId]
    );

    return res.status(200).json({
      message: "Credit notifications retrieved successfully",
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Get credit notifications error:", error);

    return res.status(500).json({
      message: "Failed to retrieve credit notifications",
    });
  }
};

module.exports = {
  createCreditTransaction,
  recordCreditPayment,
  getCustomerCreditHistory,
  getCreditNotifications,
};
