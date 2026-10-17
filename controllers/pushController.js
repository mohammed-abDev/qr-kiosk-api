const db = require("../db/dbConfige");
const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

// Save a browser's push subscription
const savePushSubscription = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({
        message: "Invalid push subscription.",
      });
    }

    await db.promise().query(
      `INSERT INTO push_subscriptions
        (user_id, endpoint, p256dh_key, auth_key)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         p256dh_key = VALUES(p256dh_key),
         auth_key = VALUES(auth_key)`,
      [userId, endpoint, keys.p256dh, keys.auth],
    );

    return res.status(201).json({
      message: "Push subscription saved successfully.",
    });
  } catch (error) {
    console.error("Save push subscription error:", error);

    return res.status(500).json({
      message: "Could not save push subscription.",
    });
  }
};

// Send a test notification to the current admin's subscribed devices
const sendTestPush = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    const [subscriptions] = await db.promise().query(
      `SELECT id, endpoint, p256dh_key, auth_key
       FROM push_subscriptions
       WHERE user_id = ?`,
      [userId],
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({
        message:
          "No push subscription found. Enable browser notifications first.",
      });
    }

    const payload = JSON.stringify({
      title: "Abdu Mart",
      body: "Push notifications are working!",
      url: "/admin/credit-notifications",
    });

    const results = await Promise.allSettled(
      subscriptions.map((subscription) =>
        webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh_key,
              auth: subscription.auth_key,
            },
          },
          payload,
        ),
      ),
    );

    const sent = results.filter(
      (result) => result.status === "fulfilled",
    ).length;

    return res.status(200).json({
      message: `Test notification sent to ${sent} of ${subscriptions.length} subscribed devices.`,
      sent,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error("Send test push error:", error);

    return res.status(500).json({
      message: "Could not send test notification.",
    });
  }
};

module.exports = {
  savePushSubscription,
  sendTestPush,
};
