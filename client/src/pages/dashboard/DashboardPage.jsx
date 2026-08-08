import DashboardContent from "./components/DashboardContent";
import MedicineContent from "./components/MedicineContent";
import FamilyPage from "../family/FamilyPage";
import ScannerContent from "./components/ScannerContent";
import ChatContent from "./components/ChatContent";
import SettingsContent from "./components/SettingsContent";

import { useState, useMemo, useEffect, useRef } from "react";
import {
    Home,
    PlusCircle,
    Camera,
    Users,
    MessageSquare,
    Settings,
    BellPlus,
    ChevronRight,
    HeartPulse,
    QrCode,
    FileEdit,
    Bot,
    Award,
    Pill,
} from "lucide-react";

import { getDashboard } from "../../services/dashboardService";
import { createLog } from "../../services/logService";
import {
    getNotifications,
    markNotificationAsRead,
} from "../../services/notificationService";


const WhatsAppIcon = ({ className }) => (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className}>
        <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.362.685 4.564 1.868 6.42L4 29l7.77-1.836A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.818a9.78 9.78 0 0 1-4.99-1.363l-.358-.213-4.61 1.09 1.113-4.49-.234-.367A9.78 9.78 0 0 1 5.2 15c0-5.965 4.848-10.818 10.804-10.818S26.808 9.035 26.808 15 21.964 24.818 16.004 24.818Zm5.63-8.144c-.308-.154-1.822-.9-2.104-1.003-.282-.103-.487-.154-.692.154-.205.308-.795 1.003-.975 1.209-.18.205-.36.231-.667.077-.308-.154-1.3-.479-2.475-1.527-.915-.816-1.533-1.824-1.713-2.132-.18-.308-.02-.475.135-.628.138-.138.308-.36.462-.54.154-.18.205-.308.308-.513.103-.205.051-.385-.026-.539-.077-.154-.692-1.669-.949-2.286-.25-.6-.504-.519-.692-.529-.18-.009-.385-.011-.59-.011-.205 0-.539.077-.821.385-.282.308-1.077 1.052-1.077 2.567 0 1.515 1.103 2.978 1.257 3.183.154.205 2.17 3.313 5.257 4.646.735.317 1.308.507 1.755.649.737.234 1.408.201 1.938.122.591-.088 1.822-.744 2.078-1.463.257-.719.257-1.335.18-1.463-.077-.128-.282-.205-.59-.36Z" />
    </svg>
);

const CircularProgress = ({ percentage }) => {
    const size = 168;
    const strokeWidth = 16;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0f766e" />
                        <stop offset="100%" stopColor="#5eead4" />
                    </linearGradient>
                </defs>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E7EBF3" strokeWidth={strokeWidth} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                />
            </svg>
            <span className="absolute text-3xl font-extrabold text-gray-900">{percentage}%</span>
        </div>
    );
};

const TOTAL_HARI_PROGRAM = 180;

const MENU_ITEMS = [
    { id: 'Dashboard', label: 'Dashboard', icon: Home },
    { id: 'Obat Saya', label: 'Obat Saya', icon: PlusCircle },
    { id: 'Scanning Resep AI', label: 'Scanning Resep AI', icon: Camera },
    { id: 'Family Monitoring', label: 'Family Monitoring', icon: Users },
    { id: 'AI Chat Doctor', label: 'AI Chat Doctor', icon: MessageSquare },
    { id: 'Pengaturan', label: 'Pengaturan', icon: Settings },
];

const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";

    return "Selamat Malam";
};

const HEADER_CONTENT = {
    Dashboard: {
        title: '',
        subtitle: 'Tetap Semangat! Konsistensi minum obat adalah kunci kesembuhan.',
    },
    'Obat Saya': {
        title: 'OBAT SAYA',
        subtitle: 'Kelola daftar dan dosis obat harian Anda',
    },
    'Scanning Resep AI': {
        title: 'SCANNING RESEP AI',
        subtitle: 'Pindai resep dokter untuk deteksi obat otomatis',
    },
    'Family Monitoring': {
        title: 'FAMILY MONITORING',
        subtitle: 'Pantau kepatuhan minum obat anggota keluarga',
    },
    'AI Chat Doctor': {
        title: 'AI CHAT DOCTOR',
        subtitle: 'Konsultasi seputar terapi bersama asisten AI',
    },
    Pengaturan: {
        title: 'PENGATURAN',
        subtitle: 'Kelola preferensi akun dan aplikasi Anda',
    },
};

const QUICK_ACTIONS = [
    { label: 'Scan Resep AI', icon: QrCode, bg: 'bg-blue-600', tab: 'Scanning Resep AI' },
    { label: 'Tambah Obat Manual', icon: FileEdit, bg: 'bg-teal-400', tab: 'Obat Saya' },
    { label: 'Chat AI Doctor', icon: Bot, bg: 'bg-blue-600', tab: 'AI Chat Doctor' },
    { label: 'Monitoring keluarga', icon: Users, bg: 'bg-teal-400', tab: 'Family Monitoring' },
];

export default function DashboardPage() {

    const [activeTab, setActiveTab] = useState("Dashboard");
    const [sisaObat, setSisaObat] = useState(0);

    const [dailyProgress, setDailyProgress] = useState(0);
    const [therapyProgress, setTherapyProgress] = useState(0);

    const [therapyDay, setTherapyDay] = useState(0);
    const [streak, setStreak] = useState(0);

    const [jadwalHariIni, setJadwalHariIni] = useState([]);

    const [showScheduleModal, setShowScheduleModal] = useState(false);

    const [notifications, setNotifications] = useState([]);
const [showNotifications, setShowNotifications] = useState(false);

const knownNotificationIds = useRef(new Set());
const firstNotificationFetch = useRef(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("Semua");


    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await getDashboard();
                const data = response.data;

                console.log("DATA DASHBOARD:", data);

                setDailyProgress(data.daily_progress || 0);
                setTherapyProgress(data.therapy_progress || 0);

                setTherapyDay(data.therapy_day || 0);

                setStreak(data.streak || 0);

                setSisaObat(data.total_stock || 0);

                setJadwalHariIni(
                    (data.today_schedule || []).map((item) => ({
                        id: item.id,
                        waktu: item.scheduled_time.slice(0, 5),
                        namaObat: item.med_name,
                        status:
                            item.status === "taken"
                                ? "Sudah Minum"
                                : "Belum Minum",
                    }))
                );
            } catch (error) {
                console.error("Dashboard Error:", error);
            }
        };

        fetchDashboard();
    }, []);

    useEffect(() => {
    const fetchNotifications = async () => {
        try {
            const response = await getNotifications();

            console.log("NOTIFICATION RESPONSE:", response);

            const data = Array.isArray(response)
                ? response
                : response?.data || [];

            // Saat pertama kali mengambil data,
            // jangan munculkan popup untuk notif lama.
            if (firstNotificationFetch.current) {
                data.forEach((notification) => {
                    knownNotificationIds.current.add(notification.id);
                });

                firstNotificationFetch.current = false;
            } else {
                // Cari notifikasi baru
                const newNotifications = data.filter(
                    (notification) =>
                        !knownNotificationIds.current.has(notification.id)
                );

                // Tampilkan desktop notification
                newNotifications.forEach((notification) => {
                    if (
                        "Notification" in window &&
                        Notification.permission === "granted"
                    ) {
                        new Notification("TBCare", {
                            body: notification.message,
                            icon: "/favicon.ico",
                        });
                    }

                    knownNotificationIds.current.add(notification.id);
                });
            }

            setNotifications(data);
        } catch (error) {
            console.error("Notification Error:", error);
        }
    };

    // Minta izin notification browser
    if ("Notification" in window) {
        if (Notification.permission === "default") {
            Notification.requestPermission().then((permission) => {
                console.log("Notification permission:", permission);
            });
        }
    }

    // Ambil notif pertama kali
    fetchNotifications();

    // Cek notif baru setiap 5 detik
    const interval = setInterval(() => {
        fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
}, []);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markNotificationAsRead(notificationId);

            setNotifications((prev) =>
                prev.map((notification) =>
                    notification.id === notificationId
                        ? { ...notification, is_read: 1 }
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

    const handleMinumObat = async (id) => {
        const target = jadwalHariIni.find(
            (item) => item.id === id
        );

        if (!target || target.status !== "Belum Minum") {
            return;
        }

        try {
            await createLog(target.id);

            const response = await getDashboard();
            const data = response.data;

            setDailyProgress(data.daily_progress || 0);
            setTherapyProgress(data.therapy_progress || 0);

            setTherapyDay(data.therapy_day || 0);

            setStreak(data.streak || 0);

            setSisaObat(data.total_stock || 0);

            setJadwalHariIni(
                (data.today_schedule || []).map((item) => ({
                    id: item.id,
                    waktu: item.scheduled_time.slice(0, 5),
                    namaObat: item.med_name,
                    status:
                        item.status === "taken"
                            ? "Sudah Minum"
                            : "Belum Minum",
                }))
            );

        } catch (err) {
            console.error(err);
        }
    };

    const filteredSchedule = jadwalHariIni.filter((item) => {

        const cocokNama = item.namaObat
            .toLowerCase()
            .includes(search.toLowerCase());

        const cocokStatus =
            filterStatus === "Semua"
                ? true
                : item.status === filterStatus;

        return cocokNama && cocokStatus;
    });

    const currentHeader = HEADER_CONTENT[activeTab];
    const namaUser =
        localStorage.getItem("nama") || "Pengguna";

    return (
        <div className="min-h-screen w-full flex bg-slate-100" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>

            <aside className="relative w-72 shrink-0 overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 px-5 py-8 flex flex-col">
                <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-40 -left-16 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative flex items-center gap-3 px-2 mb-10">
                    <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center ring-1 ring-white/20">
                        <HeartPulse className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-white text-xl font-bold tracking-wide">TBCare</span>
                </div>

                <nav className="relative flex flex-col gap-3">
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 ${isActive ? 'bg-blue-400 shadow-lg' : 'bg-white/10 hover:bg-white/20'
                                    }`}
                            >
                                <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="flex items-center justify-between px-10 py-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {activeTab === "Dashboard"
                                ? `${getGreeting()}, ${namaUser}! 👋`
                                : currentHeader.title}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">{currentHeader.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications((prev) => !prev)}
                                className="relative w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow"
                            >
                                <BellPlus
                                    className="w-5 h-5 text-gray-800"
                                    strokeWidth={2}
                                />

                                {notifications.filter(
                                    (notification) => Number(notification.is_read) === 0
                                ).length > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                                            {
                                                notifications.filter(
                                                    (notification) =>
                                                        Number(notification.is_read) === 0
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
                                        {notifications.length === 0 ? (
                                            <p className="px-5 py-6 text-sm text-gray-500">
                                                Belum ada notifikasi.
                                            </p>
                                        ) : (
                                            notifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={`px-5 py-4 border-b border-gray-100 ${Number(notification.is_read) === 0
                                                            ? "bg-blue-50"
                                                            : "bg-white"
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1">
                                                            <p
                                                                className={`text-sm ${Number(notification.is_read) === 0
                                                                        ? "font-semibold text-gray-900"
                                                                        : "text-gray-600"
                                                                    }`}
                                                            >
                                                                {notification.message}
                                                            </p>

                                                            <p className="mt-1 text-xs text-gray-400">
                                                                {notification.created_at
                                                                    ? new Date(
                                                                        notification.created_at
                                                                    ).toLocaleString("id-ID")
                                                                    : ""}
                                                            </p>
                                                        </div>

                                                        {Number(notification.is_read) === 0 && (
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
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300" />
                            <span className="font-semibold text-gray-800 text-sm">
                                {localStorage.getItem("nama") || "Pengguna"}
                            </span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-10 pb-10">
                    {activeTab === 'Dashboard' ? (
                        <>

                            <div className="grid grid-cols-12 gap-6">

                                <div className="col-span-12 lg:col-span-7 bg-white rounded-3xl shadow-sm p-7 flex flex-col">
                                    <h2 className="text-xl font-bold text-gray-900">Jadwal Hari Ini</h2>
                                    <p className="text-gray-400 text-sm mt-1 mb-5">{new Date().toLocaleDateString("id-ID", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}</p>

                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        {jadwalHariIni
                                            .slice(0, 5)
                                            .map((item, idx) => (
                                                <div
                                                    key={item.id}
                                                    className={`flex items-stretch text-sm ${idx !== jadwalHariIni.length - 1 ? 'border-b border-gray-200' : ''
                                                        }`}
                                                >
                                                    <div className="w-20 shrink-0 px-4 py-3.5 border-r border-gray-200 text-gray-700 font-medium flex items-center">
                                                        {item.waktu}
                                                    </div>
                                                    <div className="flex-1 px-4 py-3.5 border-r border-gray-200 text-gray-700 font-medium flex items-center">
                                                        {item.namaObat}
                                                    </div>
                                                    <div className="w-36 shrink-0 px-4 py-3.5 flex items-center justify-center">
                                                        {item.status === 'Belum Minum' ? (
                                                            <button
                                                                onClick={() => handleMinumObat(item.id)}
                                                                className="text-red-500 font-semibold hover:text-red-600 hover:underline transition-colors"
                                                            >
                                                                Belum Minum
                                                            </button>
                                                        ) : (
                                                            <span className="text-blue-600 font-semibold">Sudah Minum</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>

                                    <div className="flex-1 flex items-end mt-6">
                                        <button
                                            onClick={() => setShowScheduleModal(true)}
                                            className="group w-full bg-gradient-to-r from-teal-600 to-teal-400 text-white font-semibold py-3.5 rounded-full shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-1"
                                        >
                                            Lihat Jadwal Selengkapnya
                                            <ChevronRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        </button>
                                    </div>
                                </div>

                                <div className="col-span-6 lg:col-span-2 bg-white rounded-3xl shadow-sm p-6 flex flex-col">

                                    <h2 className="text-base font-bold text-gray-900 mb-4">
                                        Progres Terapi
                                    </h2>

                                    <div className="flex justify-center">
                                        <CircularProgress percentage={therapyProgress} />
                                    </div>

                                    <p className="text-gray-800 font-semibold mt-4 text-center">
                                        {therapyDay}/{TOTAL_HARI_PROGRAM} Hari
                                    </p>

                                    <div className="mt-6">

                                        <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                                            <span>Kepatuhan Hari Ini</span>
                                            <span>{dailyProgress}%</span>
                                        </div>

                                        <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">

                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                                                style={{
                                                    width: `${dailyProgress}%`,
                                                }}
                                            />

                                        </div>

                                        <p className="text-xs text-gray-400 mt-2 text-center">
                                            {dailyProgress === 100
                                                ? "Semua jadwal hari ini telah diselesaikan 🎉"
                                                : "Selesaikan semua jadwal obat hari ini"}
                                        </p>

                                    </div>

                                </div>


                                <div className="col-span-6 lg:col-span-3 flex flex-col gap-6">
                                    <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col items-center flex-1">
                                        <h2 className="text-base font-bold text-gray-900 self-start mb-3">Badge Kepatuhan</h2>
                                        <Award className="w-16 h-16 text-blue-600" strokeWidth={1.5} />
                                        <p className="text-2xl font-extrabold text-gray-900 mt-3">
                                            {streak} <span className="text-base font-bold">Hari</span>
                                        </p>
                                        <p className="text-gray-400 text-xs mt-0.5">Berturut-turut</p>
                                    </div>

                                    <div className="bg-white rounded-3xl shadow-sm p-5">
                                        <h2 className="text-sm font-bold text-gray-900 mb-2">Sisa Obat</h2>
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-bold text-gray-800">{sisaObat} Tablet</span>
                                            <Pill className="w-9 h-9 text-cyan-400 rotate-45" strokeWidth={1.5} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-6 mt-6">

                                <div className="col-span-12 lg:col-span-8 bg-slate-50 rounded-3xl shadow-sm p-7">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Action</h2>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                        {QUICK_ACTIONS.map((action) => {
                                            const Icon = action.icon;
                                            return (
                                                <button
                                                    key={action.label}
                                                    onClick={() => setActiveTab(action.tab)}
                                                    className="group flex items-center gap-3.5 text-left"
                                                >
                                                    <div
                                                        className={`w-14 h-14 rounded-2xl ${action.bg} flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105`}
                                                    >
                                                        <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                                                    </div>
                                                    <span className="font-bold text-gray-900 text-sm leading-snug">{action.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="col-span-12 lg:col-span-4 flex items-end">
                                    <div className="w-full bg-white rounded-3xl shadow-sm p-6 flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                                            <WhatsAppIcon className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">Notifikasi Aktif</h3>
                                            <p className="text-sm text-gray-400 leading-relaxed">
                                                Notifikasi akan dikirim melalui WhatsApp sesuai jadwal anda
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : activeTab === "Obat Saya" ? (
                        <MedicineContent />
                    ) : activeTab === "Family Monitoring" ? (
                        <FamilyPage />
                    ) : activeTab === "Scanning Resep AI" ? (
                        <ScannerContent />
                    ) : activeTab === "AI Chat Doctor" ? (
                        <ChatContent />
                    ) : activeTab === "Pengaturan" ? (
                        <SettingsContent />
                    ) : (
                        <DashboardContent />
                    )}

                    {showScheduleModal && (
                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                            <div className="bg-white w-[800px] max-h-[80vh] rounded-3xl shadow-xl p-6 overflow-y-auto">

                                <div className="flex justify-between items-center mb-6">

                                    <h2 className="text-2xl font-bold">
                                        Jadwal Lengkap
                                    </h2>

                                    <button
                                        onClick={() => setShowScheduleModal(false)}
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
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="border rounded-xl px-4 py-2 flex-1 outline-none focus:ring-2 focus:ring-teal-500"
                                    />

                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="border rounded-xl px-4 py-2"
                                    >
                                        <option>Semua</option>
                                        <option>Sudah Minum</option>
                                        <option>Belum Minum</option>
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

                                        {filteredSchedule.map((item) => (

                                            <tr
                                                key={item.id}
                                                className="border-b"
                                            >

                                                <td className="py-4">
                                                    {item.waktu}
                                                </td>

                                                <td>
                                                    {item.namaObat}
                                                </td>

                                                <td className="text-center">

                                                    {item.status === "Belum Minum" ? (

                                                        <button
                                                            onClick={() => handleMinumObat(item.id)}
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

                                        ))}

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