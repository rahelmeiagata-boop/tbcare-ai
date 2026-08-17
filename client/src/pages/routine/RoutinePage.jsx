import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { saveRoutine } from "../../services/routineService";

const RoutinePage = () => {
    const navigate = useNavigate();
    const [routine, setRoutine] = useState({
        wake_time: "06:00",
        breakfast_time: "07:00",
        lunch_time: "12:30",
        dinner_time: "19:00",
        sleep_time: "22:00",
    });
    const [loading, setLoading] = useState(false);
    const handleChange = (e) => {
        setRoutine({
            ...routine,
            [e.target.name]: e.target.value,
        });
    };
    const handleNext = async () => {
        try {
            setLoading(true);
            console.log("DATA YANG DIKIRIM:", routine);

            const response = await saveRoutine(routine);
            console.log(response);
            toast.success("Rutinitas berhasil disimpan.");
            navigate("/recommendation");
        } catch (err) {
            console.log("FULL ERROR:", err);
            console.log("RESPONSE:", err.response);
            console.log("DATA:", err.response?.data);
            toast.error("Gagal menyimpan rutinitas.");
        } finally {
            setLoading(false);
        }
    };

    const routineFields = [
        {
            name: "wake_time",
            label: "Jam Bangun",
        },
        {
            name: "breakfast_time",
            label: "Jam Sarapan",
        },
        {
            name: "lunch_time",
            label: "Jam Makan Siang",
        },
        {
            name: "dinner_time",
            label: "Jam Makan Malam",
        },
        {
            name: "sleep_time",
            label: "Jam Tidur",
        },
    ];

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
            <div
                className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(15,23,42,0.08)] p-6"
                style={{
                    fontFamily: "'Poppins', sans-serif",
                }}
            >
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <span className="text-lg">🤖</span>
                        </div>

                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                                AI Scheduler
                            </h1>

                            <p className="text-xs text-gray-400">
                                Atur rutinitas harian
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 leading-relaxed mt-4">
                        Masukkan waktu aktivitas harian Anda agar AI dapat
                        membuat rekomendasi jadwal minum obat.
                    </p>
                </div>

                <div className="space-y-3">
                    {routineFields.map((field) => (
                        <div
                            key={field.name}
                            className="flex items-center justify-between gap-4"
                        >
                            <label className="text-sm font-medium text-gray-700">
                                {field.label}
                            </label>

                            <input
                                type="time"
                                name={field.name}
                                value={routine[field.name]}
                                onChange={handleChange}
                                className="
                                    w-[125px]
                                    px-3
                                    py-2
                                    rounded-lg
                                    border
                                    border-gray-200
                                    bg-gray-50
                                    text-sm
                                    text-gray-800
                                    outline-none
                                    transition-all
                                    duration-200
                                    hover:border-blue-300
                                    focus:bg-white
                                    focus:border-blue-400
                                    focus:ring-2
                                    focus:ring-blue-100
                                "
                            />
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    disabled={loading}
                    className="
                        mt-6
                        w-full
                        py-2.5
                        rounded-xl
                        bg-gradient-to-r
                        from-blue-600
                        to-blue-500
                        text-white
                        text-sm
                        font-semibold
                        shadow-md
                        shadow-blue-500/20
                        transition-all
                        duration-200
                        hover:from-blue-700
                        hover:to-blue-600
                        hover:shadow-lg
                        hover:shadow-blue-500/25
                        hover:-translate-y-0.5
                        active:translate-y-0
                        disabled:opacity-60
                        disabled:cursor-not-allowed
                        disabled:hover:translate-y-0
                    "
                >
                    {loading
                        ? "Menyimpan..."
                        : "✨ Lihat Rekomendasi AI"}
                </button>
            </div>
        </div>
    );
};

export default RoutinePage;