import {
  savePushSubscription,
} from "../services/pushSubscriptionService.js";

/**
 * Kunci publik VAPID. Client memakainya untuk berlangganan push, sehingga
 * selalu sama dengan kunci yang dipakai server saat mengirim (tidak perlu
 * menyalin kunci ke konfigurasi client).
 */
export const getPublicKey = (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return res.status(503).json({
      success: false,
      message: "Push notification belum dikonfigurasi di server.",
    });
  }

  res.json({
    success: true,
    message: "Kunci publik push notification.",
    data: { public_key: publicKey },
  });
};

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