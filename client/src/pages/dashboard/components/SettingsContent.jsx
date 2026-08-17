import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { UserRound, Bell, Clock3, LogOut, ChevronRight } from "lucide-react";

const SettingsContent = () => {
    const navigate = useNavigate();

    const handleNotification = async () => {
        try {
            if (!("Notification" in window)) {
                toast.error("Browser tidak mendukung notifikasi.");
                return;
            }

            const permission = await Notification.requestPermission();

            if (permission === "granted") {
                toast.success("Notifikasi berhasil diaktifkan.");
            } else {
                toast.error("Izin notifikasi belum diberikan.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal mengaktifkan notifikasi.");
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
        <div
            className="w-full min-h-full bg-slate-100 px-8 pb-10"
            style={{ fontFamily: "'Poppins', sans-serif" }}
        >
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
                `}
            </style>

            <div className="max-w-5xl mx-auto space-y-5">

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-7 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center justify-between gap-5">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                                <UserRound
                                    className="w-6 h-6 text-blue-600"
                                    strokeWidth={2}
                                />
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Profil Saya
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Kelola informasi akun pasien Anda.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate("/profile")}
                            className="
                                group
                                flex items-center gap-2
                                bg-gradient-to-r from-blue-600 to-blue-500
                                hover:from-blue-700 hover:to-blue-600
                                active:scale-95
                                text-white
                                px-5 py-3
                                rounded-xl
                                font-semibold
                                text-sm
                                shadow-sm hover:shadow-md
                                transition-all duration-200
                                shrink-0
                            "
                        >
                            Lihat Profil

                            <ChevronRight
                                className="
                                    w-4 h-4
                                    group-hover:translate-x-0.5
                                    transition-transform
                                "
                            />
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-7 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center justify-between gap-5">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0">
                                <Bell
                                    className="w-6 h-6 text-teal-600"
                                    strokeWidth={2}
                                />
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Notifikasi
                                </h2>

                                <p className="text-sm text-gray-500 mt-1 max-w-xl">
                                    Aktifkan notifikasi untuk mendapatkan
                                    pengingat minum obat.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleNotification}
                            className="
                                bg-gradient-to-r from-teal-500 to-teal-400
                                hover:from-teal-600 hover:to-teal-500
                                active:scale-95
                                text-white
                                px-5 py-3
                                rounded-xl
                                font-semibold
                                text-sm
                                shadow-sm hover:shadow-md
                                transition-all duration-200
                                shrink-0
                            "
                        >
                            Aktifkan Notifikasi
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-7 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center justify-between gap-5">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                                <Clock3
                                    className="w-6 h-6 text-amber-500"
                                    strokeWidth={2}
                                />
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Pengingat Obat
                                </h2>

                                <p className="text-sm text-gray-500 mt-1 max-w-xl">
                                    Kelola jadwal dan pengingat konsumsi obat
                                    Anda.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleReminder}
                            className="
                                bg-gradient-to-r from-amber-500 to-yellow-400
                                hover:from-amber-600 hover:to-yellow-500
                                active:scale-95
                                text-white
                                px-5 py-3
                                rounded-xl
                                font-semibold
                                text-sm
                                shadow-sm hover:shadow-md
                                transition-all duration-200
                                shrink-0
                            "
                        >
                            Atur Pengingat
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-7 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center justify-between gap-5">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                                <LogOut
                                    className="w-6 h-6 text-red-600"
                                    strokeWidth={2}
                                />
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Keluar
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Keluar dari akun TBCare.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="
                                bg-gradient-to-r from-red-700 to-red-600
                                hover:from-red-800 hover:to-red-700
                                active:scale-95
                                text-white
                                px-5 py-3
                                rounded-xl
                                font-semibold
                                text-sm
                                shadow-sm hover:shadow-md
                                transition-all duration-200
                                shrink-0
                            "
                        >
                            Logout
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SettingsContent;