import db from "../config/db.js";

import {
  getPushSubscriptionsByUserId,
} from "./pushSubscriptionService.js";

import {
  sendPushNotification,
} from "./webPushService.js";


export const createNotification = async (
  userId,
  message
) => {
  // Ambil subscription milik pasien
  const subscriptions =
    await getPushSubscriptionsByUserId(userId);

  let pushSuccess = false;

  // Kirim Web Push jika pasien memiliki subscription
  for (const sub of subscriptions) {
    const subscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    const success = await sendPushNotification(
      subscription,
      message
    );

    if (success) {
      pushSuccess = true;
    }
  }

  // Simpan notifikasi ke database
  await db.execute(
    `
    INSERT INTO notifications
    (
      user_id,
      message,
      channel,
      status,
      is_read
    )
    VALUES (?, ?, 'web_push', ?, 0)
    `,
    [
      userId,
      message,
      pushSuccess ? "terkirim" : "menunggu",
    ]
  );

  return {
    success: true,
    pushSent: pushSuccess,
    message: pushSuccess
      ? "Pengingat berhasil dikirim."
      : "Notifikasi tersimpan, tetapi perangkat pasien belum menerima Web Push.",
  };
};


export const getNotifications = async (userId) => {
  const [rows] = await db.execute(
    `
    SELECT *
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    `,
    [userId]
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
    [notificationId, userId]
  );

  return result;
};