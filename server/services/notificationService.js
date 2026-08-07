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