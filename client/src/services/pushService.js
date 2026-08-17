import api from "./api";

const VAPID_PUBLIC_KEY =
  "BA6YVItwlw-XvEpWXc-0DHuvZkfmTDB7CNrMer1rUn0sdqfLdBDh8K9mk7ZmppZSfsXSoVwfxoyXJWWl7pACMZs";

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4
  );

  const base64 = (
    base64String +
    padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((char) =>
      char.charCodeAt(0)
    )
  );
};

export const enablePushNotification = async () => {
  if (!("serviceWorker" in navigator)) {
    throw new Error(
      "Browser tidak mendukung Service Worker."
    );
  }

  if (!("PushManager" in window)) {
    throw new Error(
      "Browser tidak mendukung Push Notification."
    );
  }

  const permission =
    await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(
      "Izin notifikasi tidak diberikan."
    );
  }

  const registration =
    await navigator.serviceWorker.register(
      "/sw.js"
    );

  console.log(
    "Service Worker berhasil terdaftar."
  );

  let subscription =
    await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(
            VAPID_PUBLIC_KEY
          ),
      });
  }

  await api.post(
    "/push/subscribe",
    subscription.toJSON()
  );

  console.log(
    "Push subscription berhasil disimpan."
  );

  return subscription;
};