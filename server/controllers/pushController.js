import {
  savePushSubscription,
} from "../services/pushSubscriptionService.js";

export const subscribePush = async (
  req,
  res
) => {
  try {
    const subscription = req.body;

    await savePushSubscription(
      req.user.id,
      subscription
    );

    res.json({
      success: true,
      message: "Push notification berhasil diaktifkan.",
    });
  } catch (error) {
    console.error(
      "SAVE PUSH SUBSCRIPTION ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Gagal mengaktifkan push notification.",
    });
  }
};