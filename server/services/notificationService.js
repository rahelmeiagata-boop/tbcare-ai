import db from "../config/db.js";

export const createNotification = async (
  userId,
  message
) => {
  await db.execute(
    `
    INSERT INTO notifications
    (
      user_id,
      message,
      channel,
      status
    )
    VALUES
    (
      ?,
      ?,
      'whatsapp',
      'menunggu'
    )
    `,
    [
      userId,
      message
    ]
  );
};

export const getNotifications = async (
  userId
) => {
  const [rows] = await db.execute(
    `
    SELECT
      *
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    `,
    [
      userId
    ]
  );

  return rows;
};

export const markNotificationAsRead = async (
  notificationId,
  userId
) => {
  const [result] = await db.execute(
    `
    UPDATE notifications
    SET is_read = 1
    WHERE id = ?
    AND user_id = ?
    `,
    [
      notificationId,
      userId
    ]
  );

  return result;
};