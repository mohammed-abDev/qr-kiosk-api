const db = require("../db/dbConfige");
const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

async function sendPushToAdmins({ title, body, url }) {
  const [subscriptions] = await db.promise().query(
    `SELECT id, endpoint, p256dh_key, auth_key
     FROM push_subscriptions`,
  );

  const payload = JSON.stringify({
    title,
    body,
    url: url || "/admin/credit-notifications",
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

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error("Push notification failed:", result.reason);

      // Remove expired subscriptions when the push service says
      // that the subscription is no longer valid.
      if (
        result.reason?.statusCode === 404 ||
        result.reason?.statusCode === 410
      ) {
        const subscription = subscriptions[index];

        db.promise()
          .query("DELETE FROM push_subscriptions WHERE id = ?", [
            subscription.id,
          ])
          .catch((error) =>
            console.error("Could not remove expired subscription:", error),
          );
      }
    }
  });

  return {
    total: subscriptions.length,
    sent: results.filter((result) => result.status === "fulfilled").length,
  };
}

module.exports = sendPushToAdmins;
