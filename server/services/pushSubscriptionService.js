import db from "../config/db.js";

export const savePushSubscription = async (
  userId,
  subscription
) => {
  const { endpoint, keys } = subscription;

  await db.execute(
    `
    INSERT INTO push_subscriptions
    (
      user_id,
      endpoint,
      p256dh,
      auth
    )
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      user_id = VALUES(user_id),
      p256dh = VALUES(p256dh),
      auth = VALUES(auth)
    `,
    [
      userId,
      endpoint,
      keys.p256dh,
      keys.auth,
    ]
  );
};


export const getPushSubscriptionsByUserId = async (
    userId
) => {
    const [rows] = await db.execute(
        `
        SELECT
            id,
            endpoint,
            p256dh,
            auth
        FROM push_subscriptions
        WHERE user_id = ?
        `,
        [userId]
    );

    return rows;
};