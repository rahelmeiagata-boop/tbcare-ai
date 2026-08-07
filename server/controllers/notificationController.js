import {
  createNotification,
  getNotifications,
} from "../services/notificationService.js";

import {
  successResponse,
  errorResponse,
} from "../utils/response.js";

export const sendReminder = async (req, res) => {
  try {
    const { user_id, message } = req.body;

    await createNotification(
      user_id,
      message
    );

    successResponse(
      res,
      "Pengingat berhasil dikirim."
    );

  } catch (err) {
    errorResponse(
      res,
      err.message
    );
  }
};

export const getMyNotifications = async (
  req,
  res
) => {
  try {
    const notifications =
      await getNotifications(
        req.user.id
      );

    successResponse(
      res,
      "Notifikasi berhasil diambil.",
      notifications
    );

  } catch (err) {
    errorResponse(
      res,
      err.message
    );
  }
};