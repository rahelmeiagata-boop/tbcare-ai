import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const VAPID_PUBLIC_KEY =
    import.meta.env.VITE_VAPID_PUBLIC_KEY;

const API_URL = "http://localhost:5000/api";

const urlBase64ToUint8Array = (base64String) => {
    const padding =
        "=".repeat((4 - (base64String.length % 4)) % 4);

    const base64 = (
        base64String + padding
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

const SettingsContent = () => {
    const navigate = useNavigate();

    const handleNotification = async () => {
        try {
            if (!("Notification" in window)) {
                toast.error(
                    "Browser tidak mendukung notifikasi."
                );
                return;
            }

            if (!("serviceWorker" in navigator)) {
                toast.error(
                    "Browser tidak mendukung Service Worker."
                );
                return;
            }

            if (!VAPID_PUBLIC_KEY) {
                toast.error(
                    "VAPID Public Key belum tersedia."
                );
                console.error(
                    "VITE_VAPID_PUBLIC_KEY tidak ditemukan."
                );
                return;
            }

            const permission =
                await Notification.requestPermission();

            if (permission !== "granted") {
                toast.error(
                    "Izin notifikasi belum diberikan."
                );
                return;
            }

            const registration =
                await navigator.serviceWorker.register(
                    "/sw.js"
                );

            console.log(
                "Service Worker aktif:",
                registration
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

            console.log(
                "Push Subscription:",
                subscription
            );

            const token =
                localStorage.getItem("token");

            if (!token) {
                toast.error(
                    "Sesi login tidak ditemukan."
                );
                return;
            }

            const response = await fetch(
                `${API_URL}/push/subscribe`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify(
                        subscription.toJSON()
                    ),
                }
            );

            const result =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Gagal menyimpan subscription."
                );
            }

            toast.success(
                "Notifikasi berhasil diaktifkan."
            );

        } catch (error) {
            console.error(
                "PUSH NOTIFICATION ERROR:",
                error
            );

            toast.error(
                error.message ||
                "Gagal mengaktifkan notifikasi."
            );
        }
    };

    const handleReminder = () => {
        navigate("/schedules");
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        toast.success("Berhasil logout.");

        navigate("/login");
    };

    return (
        <div className="p-8">

            <h1 className="text-3xl font-bold text-gray-900">
                Pengaturan
            </h1>

            <p className="text-gray-500 mt-2 mb-8">
                Kelola akun dan preferensi aplikasi Anda.
            </p>

            <div className="space-y-5 max-w-3xl">

                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-bold mb-2">
                        Profil Saya
                    </h2>

                    <p className="text-gray-500 mb-4">
                        Kelola informasi akun pasien Anda.
                    </p>

                    <button
                        onClick={() =>
                            navigate("/profile")
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold"
                    >
                        Lihat Profil
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-bold mb-2">
                        Notifikasi
                    </h2>

                    <p className="text-gray-500 mb-4">
                        Aktifkan notifikasi untuk mendapatkan
                        pengingat minum obat.
                    </p>

                    <button
                        onClick={handleNotification}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold"
                    >
                        Aktifkan Notifikasi
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-bold mb-2">
                        Pengingat Obat
                    </h2>

                    <p className="text-gray-500 mb-4">
                        Kelola jadwal dan pengingat konsumsi
                        obat Anda.
                    </p>

                    <button
                        onClick={handleReminder}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-lg font-semibold"
                    >
                        Atur Pengingat
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-bold mb-2">
                        Keluar
                    </h2>

                    <p className="text-gray-500 mb-4">
                        Keluar dari akun TBCare.
                    </p>

                    <button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg font-semibold"
                    >
                        Logout
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SettingsContent;