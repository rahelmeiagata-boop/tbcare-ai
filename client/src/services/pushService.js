import api from "./api";

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

// Kunci publik VAPID diambil dari server, supaya selalu sama dengan kunci
// yang dipakai server untuk mengirim notifikasi.
const getServerPublicKey = async () => {
  const response = await api.get("/push/public-key");
  const publicKey = response.data?.data?.public_key;

  if (!publicKey) {
    throw new Error("Kunci notifikasi dari server tidak tersedia.");
  }

  return publicKey;
};

const sameKey = (subscription, keyBytes) => {
  const current = subscription.options?.applicationServerKey;

  if (!current) return false;

  const bytes = new Uint8Array(current);

  return bytes.length === keyBytes.length && bytes.every((value, i) => value === keyBytes[i]);
};

/**
 * Minta izin, daftarkan service worker (/sw.js), berlangganan push, lalu
 * simpan langganan ke server. Aman dipanggil berulang kali.
 */
export const enablePushNotification = async () => {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Browser tidak mendukung Service Worker.");
  }

  if (!("PushManager" in window)) {
    throw new Error("Browser tidak mendukung Push Notification.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Izin notifikasi tidak diberikan.");
  }

  const keyBytes = urlBase64ToUint8Array(await getServerPublicKey());
  const registration = await navigator.serviceWorker.register("/sw.js");

  let subscription = await registration.pushManager.getSubscription();

  // Langganan lama yang dibuat dengan kunci berbeda tidak bisa dipakai server.
  if (subscription && !sameKey(subscription, keyBytes)) {
    await subscription.unsubscribe();
    subscription = null;
  }

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes,
    });
  }

  await api.post("/push/subscribe", subscription.toJSON());

  return subscription;
};
