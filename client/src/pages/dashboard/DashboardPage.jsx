import DashboardContent from "./components/DashboardContent";
import MedicineContent from "./components/MedicineContent";
import FamilyPage from "../family/FamilyPage";
import ScannerContent from "./components/ScannerContent";
import ChatContent from "./components/ChatContent";
import SettingsContent from "./components/SettingsContent";

import { useState, useEffect, useRef } from "react";
import { Home, PlusCircle, Camera, Users, MessageSquare, Settings, BellPlus, HeartPulse } from "lucide-react";
import { getDashboard } from "../../services/dashboardService";
import { createLog } from "../../services/logService";
import { getNotifications, markNotificationAsRead, } from "../../services/notificationService";
import { enablePushNotification } from "../../services/pushService";

const MENU_ITEMS = [
    {
        id: "Dashboard",
        label: "Dashboard",
        icon: Home,
    },
    {
        id: "Obat Saya",
        label: "Obat Saya",
        icon: PlusCircle,
    },
    {
        id: "Scanning Resep AI",
        label: "Scanning Resep AI",
        icon: Camera,
    },
    {
        id: "Family Monitoring",
        label: "Family Monitoring",
        icon: Users,
    },
    {
        id: "AI Chat Doctor",
        label: "AI Chat Doctor",
        icon: MessageSquare,
    },
    {
        id: "Pengaturan",
        label: "Pengaturan",
        icon: Settings,
    },
];


const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
        return "Selamat Pagi";
    }

    if (hour < 15) {
        return "Selamat Siang";
    }

    if (hour < 18) {
        return "Selamat Sore";
    }

    return "Selamat Malam";
};

const HEADER_CONTENT = {
    Dashboard: {
        title: "",
        subtitle:
            "Tetap Semangat! Konsistensi minum obat adalah kunci kesembuhan.",
    },

    "Obat Saya": {
        title: "OBAT SAYA",
        subtitle:
            "Kelola daftar dan dosis obat harian Anda",
    },

    "Scanning Resep AI": {
        title: "SCANNING RESEP AI",
        subtitle:
            "Pindai resep dokter untuk deteksi obat otomatis",
    },

    "Family Monitoring": {
        title: "FAMILY MONITORING",
        subtitle:
            "Pantau kepatuhan minum obat anggota keluarga",
    },

    "AI Chat Doctor": {
        title: "AI CHAT DOCTOR",
        subtitle:
            "Konsultasi seputar terapi bersama asisten AI",
    },

    Pengaturan: {
        title: "PENGATURAN",
        subtitle:
            "Kelola preferensi akun dan aplikasi Anda",
    },
};

export default function DashboardPage() {

    const [activeTab, setActiveTab] =
        useState("Dashboard");
    const [sisaObat, setSisaObat] =
        useState(0);
    const [dailyProgress, setDailyProgress] =
        useState(0);
    const [therapyProgress, setTherapyProgress] =
        useState(0);
    const [therapyDay, setTherapyDay] =
        useState(0);
    const [streak, setStreak] =
        useState(0);
    const [jadwalHariIni, setJadwalHariIni] =
        useState([]);
    const getSavedProfile = () => {
    try {
        const savedUser =
            localStorage.getItem("user");

        if (!savedUser) {
            return {
                nama: "",
                email: "",
                nomor_hp: "",
                foto: "",
                role: "",
                id: null,
            };
        }

        const user = JSON.parse(savedUser);

        if (!user?.id) {
            return {
                nama: user?.nama || "",
                email: user?.email || "",
                nomor_hp: user?.nomor_hp || "",
                foto: "",
                role: user?.role || "",
                id: null,
            };
        }

        const profileKey =
            `tbcare_profile_${user.id}`;

        const savedProfile =
            localStorage.getItem(profileKey);

        if (!savedProfile) {
            return {
                nama: user.nama || "",
                email: user.email || "",
                nomor_hp: user.nomor_hp || "",
                foto: "",
                role: user.role || "",
                id: user.id,
            };
        }

        const profileData =
            JSON.parse(savedProfile);

        return {
            id: user.id,
            nama: profileData.nama || user.nama || "",
            email:
                profileData.email ||
                user.email ||
                "",
            nomor_hp:
                profileData.nomor_hp ||
                user.nomor_hp ||
                "",
            foto: profileData.foto || "",
            role: user.role || "",
        };
    } catch (error) {
        console.error(
            "Gagal membaca profil:",
            error
        );

        return {
            nama: "",
            email: "",
            nomor_hp: "",
            foto: "",
            role: "",
            id: null,
        };
    }
};

const [profile, setProfile] = useState(
    getSavedProfile
);
    const [showScheduleModal, setShowScheduleModal] =
        useState(false);
    const [notifications, setNotifications] =
        useState([]);
    const [showNotifications, setShowNotifications] =
        useState(false);
    const knownNotificationIds =
        useRef(new Set());
    const firstNotificationFetch =
        useRef(true);
    const [search, setSearch] =
        useState("");
    const [filterStatus, setFilterStatus] =
        useState("Semua");

    useEffect(() => {
        const loadProfile = () => {
            const savedUser = localStorage.getItem("user");
            const savedProfile = localStorage.getItem("tbcare_profile");

            const user = savedUser
                ? JSON.parse(savedUser)
                : null;

            const profileData = savedProfile
                ? JSON.parse(savedProfile)
                : null;

            if (!user) {
                setProfile({
                    nama: "",
                    email: "",
                    nomor_hp: "",
                    foto: "",
                    role: "",
                    id: null,
                });
                return;
            }

            const sameUser =
                profileData &&
                profileData.email === user.email;

            setProfile({
                id: user.id,
                nama: sameUser
                    ? profileData.nama
                    : user.nama || "",
                email: user.email || "",
                nomor_hp: sameUser
                    ? profileData.nomor_hp || ""
                    : user.nomor_hp || "",
                foto: sameUser
                    ? profileData.foto || ""
                    : "",
                role: user.role || "",
            });
        };

        loadProfile();

        window.addEventListener(
            "storage",
            loadProfile
        );

        window.addEventListener(
            "profileUpdated",
            loadProfile
        );

        return () => {
            window.removeEventListener(
                "storage",
                loadProfile
            );

            window.removeEventListener(
                "profileUpdated",
                loadProfile
            );
        };
    }, []);

    useEffect(() => {
    const loadProfile = () => {
        setProfile(getSavedProfile());
    };

    loadProfile();

    window.addEventListener(
        "storage",
        loadProfile
    );

    window.addEventListener(
        "profileUpdated",
        loadProfile
    );

    return () => {
        window.removeEventListener(
            "storage",
            loadProfile
        );

        window.removeEventListener(
            "profileUpdated",
            loadProfile
        );
    };
}, []);

    const fetchDashboard = async () => {

        try {

            const response =
                await getDashboard();

            const data =
                response.data;

            console.log(
                "DATA DASHBOARD:",
                data
            );
            setDailyProgress(
                data.daily_progress || 0
            );
            setTherapyProgress(
                data.therapy_progress || 0
            );
            setTherapyDay(
                data.therapy_day || 0
            );
            setStreak(
                data.streak || 0
            );
            setSisaObat(
                data.total_stock || 0
            );
            setJadwalHariIni(
                (data.today_schedule || [])
                    .map((item) => ({
                        id: item.id,
                        waktu:
                            item.scheduled_time
                                .slice(0, 5),
                        namaObat:
                            item.med_name,
                        status:
                            item.status ===
                                "taken"
                                ? "Sudah Minum"
                                : "Belum Minum",
                    }))
            );

        } catch (error) {

            console.error(
                "Dashboard Error:",
                error
            );
        }
    };


    useEffect(() => {

        fetchDashboard();

    }, []);

    useEffect(() => {

        const fetchNotifications =
            async () => {
                try {
                    const response =
                        await getNotifications();
                    console.log(
                        "NOTIFICATION RESPONSE:",
                        response
                    );
                    const data =
                        Array.isArray(response)
                            ? response
                            : response?.data || [];

                    if (
                        firstNotificationFetch.current
                    ) {
                        data.forEach(
                            (notification) => {

                                knownNotificationIds.current.add(
                                    notification.id
                                );
                            }
                        );

                        firstNotificationFetch.current =
                            false;

                    } else {

                        const newNotifications =
                            data.filter(
                                (notification) =>
                                    !knownNotificationIds.current.has(
                                        notification.id
                                    )
                            );

                        newNotifications.forEach(
                            (notification) => {
                                if (
                                    "Notification" in
                                    window &&
                                    Notification.permission ===
                                    "granted"
                                ) {
                                    new Notification(
                                        "TBCare",
                                        {
                                            body: notification.message,
                                            icon: "/favicon.ico",
                                        }
                                    );
                                }
                                knownNotificationIds.current.add(
                                    notification.id
                                );
                            }
                        );
                    }

                    setNotifications(data);
                } catch (error) {
                    console.error(
                        "Notification Error:",
                        error
                    );
                }
            };

        if ("Notification" in window) {
            if (
                Notification.permission ===
                "default"
            ) {
                Notification.requestPermission()
                    .then((permission) => {
                        console.log(
                            "Notification permission:",
                            permission
                        );
                    });
            }
        }

        fetchNotifications();
        const interval =
            setInterval(
                fetchNotifications,
                5000
            );
        return () =>
            clearInterval(interval);

    }, []);

    const handleMarkAsRead =
        async (notificationId) => {
            try {
                await markNotificationAsRead(
                    notificationId
                );
                setNotifications(
                    (prev) =>
                        prev.map(
                            (notification) =>
                                notification.id ===
                                    notificationId
                                    ? {
                                        ...notification,
                                        is_read: 1,
                                    }
                                    : notification
                        )
                );

            } catch (error) {
                console.error(
                    "Gagal menandai notifikasi:",
                    error
                );
            }
        };

    const handleMinumObat =
        async (id) => {

            const target =
                jadwalHariIni.find(
                    (item) =>
                        item.id === id
                );
            if (
                !target ||
                target.status !==
                "Belum Minum"
            ) {
                return;
            }
            try {
                await createLog(
                    target.id
                );
                await fetchDashboard();
            } catch (error) {
                console.error(
                    error
                );
            }
        };

    const filteredSchedule =
        jadwalHariIni.filter(
            (item) => {

                const cocokNama =
                    item.namaObat
                        .toLowerCase()
                        .includes(
                            search.toLowerCase()
                        );
                const cocokStatus =
                    filterStatus ===
                        "Semua"
                        ? true
                        : item.status ===
                        filterStatus;
                return (
                    cocokNama &&
                    cocokStatus
                );
            }
        );

    const currentHeader =
        HEADER_CONTENT[
        activeTab
        ];
    const namaUser =
        profile.nama;

    return (
        <div
            className="min-h-screen w-full flex bg-slate-100"
            style={{
                fontFamily:
                    "'Poppins', sans-serif",
            }}
        >

            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
                `}
            </style>
            <aside className="relative w-72 shrink-0 overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 px-5 py-8 flex flex-col">
                <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-40 -left-16 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative flex items-center gap-3 px-2 mb-10">
                    <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center ring-1 ring-white/20">
                        <HeartPulse
                            className="w-5 h-5 text-white"
                            strokeWidth={2.5}
                        />
                    </div>
                    <span className="text-white text-xl font-bold tracking-wide">
                        TBCare
                    </span>

                </div>
                <nav className="relative flex flex-col gap-3">

                    {MENU_ITEMS.map(
                        (item) => {

                            const Icon =
                                item.icon;
                            const isActive =
                                activeTab ===
                                item.id;

                            return (

                                <button
                                    key={item.id}
                                    onClick={() =>
                                        setActiveTab(
                                            item.id
                                        )
                                    }
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 ${isActive
                                        ? "bg-blue-400 shadow-lg"
                                        : "bg-white/10 hover:bg-white/20"
                                        }`}
                                >
                                    <Icon
                                        className="w-5 h-5 shrink-0"
                                        strokeWidth={2}
                                    />
                                    <span>
                                        {item.label}
                                    </span>

                                </button>
                            );
                        }
                    )}

                </nav>

            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="flex items-center justify-between px-10 py-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {activeTab ===
                                "Dashboard"
                                ? `${getGreeting()}, ${namaUser}! 👋`
                                : currentHeader.title}

                        </h1>

                        <p className="text-gray-500 text-sm mt-1">
                            {
                                currentHeader.subtitle
                            }
                        </p>

                    </div>
                    <div className="flex items-center gap-5">
                        <div className="relative">

                            <button
                                onClick={() =>
                                    setShowNotifications(
                                        (prev) =>
                                            !prev
                                    )
                                }
                                className="relative w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow"
                            >

                                <BellPlus
                                    className="w-5 h-5 text-gray-800"
                                    strokeWidth={2}
                                />


                                {notifications.filter(
                                    (notification) =>
                                        Number(
                                            notification.is_read
                                        ) === 0
                                ).length >
                                    0 && (

                                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">

                                            {
                                                notifications.filter(
                                                    (
                                                        notification
                                                    ) =>
                                                        Number(
                                                            notification.is_read
                                                        ) ===
                                                        0
                                                ).length
                                            }

                                        </span>
                                    )}

                            </button>


                            {showNotifications && (

                                <div className="absolute right-0 top-14 z-50 w-80 rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden">
                                    <div className="px-5 py-4 border-b">

                                        <h3 className="font-bold text-gray-900">
                                            Notifikasi
                                        </h3>

                                    </div>


                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length ===
                                            0 ? (

                                            <p className="px-5 py-6 text-sm text-gray-500">
                                                Belum ada notifikasi.
                                            </p>

                                        ) : (

                                            notifications.map(
                                                (
                                                    notification
                                                ) => (

                                                    <div
                                                        key={
                                                            notification.id
                                                        }
                                                        className={`px-5 py-4 border-b border-gray-100 ${Number(
                                                            notification.is_read
                                                        ) ===
                                                            0
                                                            ? "bg-blue-50"
                                                            : "bg-white"
                                                            }`}
                                                    >

                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">

                                                                <p
                                                                    className={`text-sm ${Number(
                                                                        notification.is_read
                                                                    ) ===
                                                                        0
                                                                        ? "font-semibold text-gray-900"
                                                                        : "text-gray-600"
                                                                        }`}
                                                                >
                                                                    {
                                                                        notification.message
                                                                    }
                                                                </p>


                                                                <p className="mt-1 text-xs text-gray-400">

                                                                    {notification.created_at
                                                                        ? new Date(
                                                                            notification.created_at
                                                                        ).toLocaleString(
                                                                            "id-ID"
                                                                        )
                                                                        : ""}

                                                                </p>

                                                            </div>


                                                            {Number(
                                                                notification.is_read
                                                            ) ===
                                                                0 && (

                                                                    <button
                                                                        onClick={() =>
                                                                            handleMarkAsRead(
                                                                                notification.id
                                                                            )
                                                                        }
                                                                        className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                                                    >
                                                                        Tandai sudah dibaca
                                                                    </button>
                                                                )}

                                                        </div>

                                                    </div>
                                                )
                                            )
                                        )}

                                    </div>

                                </div>
                            )}

                        </div>

                        <div className="flex items-center gap-2.5">
                            {profile.foto ? (
                                <img
                                    src={
                                        profile.foto
                                    }
                                    alt="Foto profil"
                                    className="w-10 h-10 rounded-full object-cover"
                                />

                            ) : (

                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-bold text-gray-600">

                                    {profile.nama
                                        .split(" ")
                                        .map(
                                            (
                                                word
                                            ) =>
                                                word[0]
                                        )
                                        .slice(
                                            0,
                                            2
                                        )
                                        .join(
                                            ""
                                        )
                                        .toUpperCase()}

                                </div>
                            )}


                            <span className="font-semibold text-gray-800 text-sm">

                                {
                                    profile.nama
                                }

                            </span>

                        </div>

                    </div>

                </header>

                <main className="flex-1 px-10 pb-10">
                    {activeTab ===
                        "Dashboard" ? (

                        <DashboardContent
                            dailyProgress={
                                dailyProgress
                            }
                            therapyProgress={
                                therapyProgress
                            }
                            therapyDay={
                                therapyDay
                            }
                            streak={
                                streak
                            }
                            sisaObat={
                                sisaObat
                            }
                            jadwalHariIni={
                                jadwalHariIni
                            }
                            handleMinumObat={
                                handleMinumObat
                            }
                            setActiveTab={
                                setActiveTab
                            }
                            setShowScheduleModal={
                                setShowScheduleModal
                            }
                        />

                    ) : activeTab ===
                        "Obat Saya" ? (
                        <MedicineContent />
                    ) : activeTab ===
                        "Family Monitoring" ? (
                        <FamilyPage />
                    ) : activeTab ===
                        "Scanning Resep AI" ? (
                        <ScannerContent />
                    ) : activeTab ===
                        "AI Chat Doctor" ? (
                        <ChatContent />
                    ) : activeTab ===
                        "Pengaturan" ? (
                        <SettingsContent />
                    ) : null}

                    {showScheduleModal && (

                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                            <div className="bg-white w-[800px] max-h-[80vh] rounded-3xl shadow-xl p-6 overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">

                                    <h2 className="text-2xl font-bold">
                                        Jadwal Lengkap
                                    </h2>

                                    <button
                                        onClick={() =>
                                            setShowScheduleModal(
                                                false
                                            )
                                        }
                                        className="text-gray-500 hover:text-red-500 text-2xl"
                                    >
                                        ✕
                                    </button>

                                </div>

                                <div className="flex justify-between items-center gap-4 mb-6">
                                    <input
                                        type="text"
                                        placeholder="Cari obat..."
                                        value={search}
                                        onChange={(
                                            e
                                        ) =>
                                            setSearch(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="border rounded-xl px-4 py-2 flex-1 outline-none focus:ring-2 focus:ring-teal-500"
                                    />


                                    <select
                                        value={
                                            filterStatus
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setFilterStatus(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="border rounded-xl px-4 py-2"
                                    >

                                        <option>
                                            Semua
                                        </option>

                                        <option>
                                            Sudah Minum
                                        </option>

                                        <option>
                                            Belum Minum
                                        </option>

                                    </select>

                                </div>

                                <table className="w-full">

                                    <thead>

                                        <tr className="border-b">

                                            <th className="py-3 text-left">
                                                Jam
                                            </th>

                                            <th className="py-3 text-left">
                                                Obat
                                            </th>

                                            <th className="py-3 text-center">
                                                Status
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {filteredSchedule.map(
                                            (
                                                item
                                            ) => (

                                                <tr
                                                    key={
                                                        item.id
                                                    }
                                                    className="border-b"
                                                >

                                                    <td className="py-4">
                                                        {
                                                            item.waktu
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            item.namaObat
                                                        }
                                                    </td>

                                                    <td className="text-center">

                                                        {item.status ===
                                                            "Belum Minum" ? (

                                                            <button
                                                                onClick={() =>
                                                                    handleMinumObat(
                                                                        item.id
                                                                    )
                                                                }
                                                                className="text-red-500 font-semibold hover:underline"
                                                            >
                                                                Belum Minum
                                                            </button>

                                                        ) : (

                                                            <span className="text-blue-600 font-semibold">
                                                                Sudah Minum
                                                            </span>

                                                        )}

                                                    </td>

                                                </tr>
                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>
                        </div>
                    )}

                </main>

            </div>
        </div>
    );
}