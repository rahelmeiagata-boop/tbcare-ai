import { ChevronRight, Award, Pill, QrCode, FileEdit, Bot, Users,} from "lucide-react";

const TOTAL_HARI_PROGRAM = 180;
const QUICK_ACTIONS = [
    {
        label: "Scan Resep AI",
        icon: QrCode,
        bg: "bg-blue-600",
        tab: "Scanning Resep AI",
    },
    {
        label: "Tambah Obat Manual",
        icon: FileEdit,
        bg: "bg-teal-400",
        tab: "Obat Saya",
    },
    {
        label: "Chat AI Doctor",
        icon: Bot,
        bg: "bg-blue-600",
        tab: "AI Chat Doctor",
    },
    {
        label: "Monitoring keluarga",
        icon: Users,
        bg: "bg-teal-400",
        tab: "Family Monitoring",
    },
];

const WhatsAppIcon = ({ className = "" }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M20.52 3.48A11.84 11.84 0 0 0 12.08 0C5.53 0 .2 5.32.2 11.87c0 2.09.55 4.12 1.59 5.91L.11 24l6.37-1.67a11.87 11.87 0 0 0 5.6 1.42h.01c6.55 0 11.87-5.32 11.87-11.87 0-3.17-1.23-6.15-3.44-8.4ZM12.09 21.73h-.01a9.86 9.86 0 0 1-5.02-1.37l-.36-.21-3.78.99 1.01-3.68-.23-.38a9.87 9.87 0 1 1 8.39 4.65Zm5.41-7.39c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.79-1.68-2.09-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.64-.93-2.25-.24-.59-.49-.51-.68-.52h-.58c-.2 0-.52.07-.8.37-.28.3-1.05 1.02-1.05 2.49s1.08 2.89 1.23 3.09c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"
            fill="currentColor"
        />
    </svg>
);

const CircularProgress = ({ percentage }) => {
    const size = 120;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset =
        circumference - (percentage / 100) * circumference;

    return (
        <div
            className="relative flex items-center justify-center"
            style={{
                width: size,
                height: size,
            }}
        >
            <svg
                width={size}
                height={size}
                className="-rotate-90"
            >
                <defs>
                    <linearGradient
                        id="progressGradient"
                        x1="0%"
                        y1="100%"
                        x2="100%"
                        y2="0%"
                    >
                        <stop
                            offset="0%"
                            stopColor="#0f766e"
                        />

                        <stop
                            offset="100%"
                            stopColor="#5eead4"
                        />
                    </linearGradient>
                </defs>

                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#E7EBF3"
                    strokeWidth={strokeWidth}
                />

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

            <span className="absolute text-3xl font-extrabold text-gray-900">
                {percentage}%
            </span>
        </div>
    );
};

const DashboardContent = ({ dailyProgress, therapyProgress, therapyDay, streak, sisaObat, jadwalHariIni, handleMinumObat, setActiveTab, setShowScheduleModal }) => {
    return (
        <>
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-7 bg-white rounded-3xl shadow-sm p-7 flex flex-col">
                    <h2 className="text-xl font-bold text-gray-900">
                        Jadwal Hari Ini
                    </h2>

                    <p className="text-gray-400 text-sm mt-1 mb-5">
                        {new Date().toLocaleDateString(
                            "id-ID",
                            {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            }
                        )}
                    </p>

                    <div className="border border-gray-200 rounded-xl overflow-hidden">

                        {jadwalHariIni
                            .slice(0, 5)
                            .map((item, idx) => (
                                <div
                                    key={item.id}
                                    className={`flex items-stretch text-sm ${
                                        idx !==
                                        jadwalHariIni.slice(0, 5)
                                            .length -
                                            1
                                            ? "border-b border-gray-200"
                                            : ""
                                    }`}
                                >

                                    <div className="w-20 shrink-0 px-4 py-3.5 border-r border-gray-200 text-gray-700 font-medium flex items-center">
                                        {item.waktu}
                                    </div>

                                    <div className="flex-1 px-4 py-3.5 border-r border-gray-200 text-gray-700 font-medium flex items-center">
                                        {item.namaObat}
                                    </div>

                                    <div className="w-36 shrink-0 px-4 py-3.5 flex items-center justify-center">

                                        {item.status ===
                                        "Belum Minum" ? (
                                            <button
                                                onClick={() =>
                                                    handleMinumObat(
                                                        item.id
                                                    )
                                                }
                                                className="text-red-500 font-semibold hover:text-red-600 hover:underline transition-colors"
                                            >
                                                Belum Minum
                                            </button>
                                        ) : (
                                            <span className="text-blue-600 font-semibold">
                                                Sudah Minum
                                            </span>
                                        )}

                                    </div>
                                </div>
                            ))}

                    </div>

                    <div className="flex-1 flex items-end mt-6">

                        <button
                            onClick={() =>
                                setShowScheduleModal(true)
                            }
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
                        <CircularProgress
                            percentage={therapyProgress}
                        />
                    </div>

                    <p className="text-gray-800 font-semibold mt-4 text-center">
                        {therapyDay}/{TOTAL_HARI_PROGRAM} Hari
                    </p>

                    <div className="mt-6">

                        <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                            <span>
                                Kepatuhan Hari Ini
                            </span>

                            <span>
                                {dailyProgress}%
                            </span>
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

                        <h2 className="text-base font-bold text-gray-900 self-start mb-3">
                            Badge Kepatuhan
                        </h2>

                        <Award
                            className="w-16 h-16 text-blue-600"
                            strokeWidth={1.5}
                        />

                        <p className="text-2xl font-extrabold text-gray-900 mt-3">
                            {streak}{" "}
                            <span className="text-base font-bold">
                                Hari
                            </span>
                        </p>

                        <p className="text-gray-400 text-xs mt-0.5">
                            Berturut-turut
                        </p>

                    </div>

                    <div className="bg-white rounded-3xl shadow-sm p-5">

                        <h2 className="text-sm font-bold text-gray-900 mb-2">
                            Sisa Obat
                        </h2>

                        <div className="flex items-center justify-between">

                            <span className="text-lg font-bold text-gray-800">
                                {sisaObat} Tablet
                            </span>

                            <Pill
                                className="w-9 h-9 text-cyan-400 rotate-45"
                                strokeWidth={1.5}
                            />

                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 mt-6">
                <div className="col-span-12 lg:col-span-8 bg-slate-50 rounded-3xl shadow-sm p-7">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                        Quick Action
                    </h2>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">

                        {QUICK_ACTIONS.map((action) => {
                            const Icon = action.icon;

                            return (
                                <button
                                    key={action.label}
                                    onClick={() =>
                                        setActiveTab(
                                            action.tab
                                        )
                                    }
                                    className="group flex items-center gap-3.5 text-left"
                                >

                                    <div
                                        className={`w-14 h-14 rounded-2xl ${action.bg} flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105`}
                                    >
                                        <Icon
                                            className="w-7 h-7 text-white"
                                            strokeWidth={2}
                                        />
                                    </div>

                                    <span className="font-bold text-gray-900 text-sm leading-snug">
                                        {action.label}
                                    </span>

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
                            <h3 className="font-bold text-gray-900 mb-1">
                                Notifikasi Aktif
                            </h3>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Notifikasi akan dikirim melalui WhatsApp sesuai jadwal anda
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
};

export default DashboardContent;