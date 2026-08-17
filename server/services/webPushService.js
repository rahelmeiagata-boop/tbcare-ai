import webpush from "../config/webPush.js";

export const sendPushNotification = async (
  subscription,
  message
) => {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: "TBCare",
        body: message,
        icon: "/logo.png",
      })
    );

    return true;
  } catch (error) {
    console.error(
      "WEB PUSH ERROR:",
      error.message
    );

    return false;
  }
};