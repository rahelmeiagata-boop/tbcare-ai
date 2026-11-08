import { useEffect, useState } from "react";
import {
    CheckCircle2,
    ClipboardCheck,
    MessageCircle,
    Save,
} from "lucide-react";
import api from "../../../services/api";


const CheckInContent = ({ onComplete }) => {
    const [condition, setCondition] = useState("");
    const [complaints, setComplaints] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [notes, setNotes] = useState("");

    const [saved, setSaved] = useState(false);
    const [alreadySaved, setAlreadySaved] = useState(false);

    const today = (() => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    })();

    useEffect(() => {
        const fetchTodayCheckin = async () => {
            try {
                const response = await api.get("/checkins");
                const checkins = response.data.data || [];

                const todayCheckin = checkins.find(
                    (item) => String(item.date).slice(0, 10) === today
                );

                if (todayCheckin) {
                    setAlreadySaved(true);
                    setCondition(todayCheckin.condition || "");
                    setComplaints(todayCheckin.complaints || "");
                    setDifficulty(todayCheckin.difficulty || "");
                    setNotes(todayCheckin.notes || "");
                }
            } catch (error) {
                console.error("Gagal mengambil check-in:", error);
            }
        };

        fetchTodayCheckin();
    }, [today]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!condition) {
            alert("Silakan pilih kondisi Anda hari ini.");
            return;
        }

        try {
            await api.post("/checkins", {
                date: today,
                condition,
                complaints,
                difficulty,
                notes,
            });

            setSaved(true);
            setAlreadySaved(true);

            setTimeout(() => {
                if (onComplete) onComplete();
            }, 800);

            setTimeout(() => {
                setSaved(false);
            }, 3000);
        } catch (error) {
            console.error("Gagal menyimpan check-in:", error);

            alert(
                error.response?.data?.message ||
                "Check-in gagal disimpan. Silakan coba lagi."
            );
        }
    };
    return (
        <div className="max-w-4xl mx-auto">

            {/* HEADER */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <ClipboardCheck className="w-6 h-6 text-blue-600" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Daily Check-in
                        </h2>

                        <p className="text-sm text-gray-500">
                            Ceritakan kondisi Anda hari ini.
                        </p>
                    </div>
                </div>

                <p className="text-sm text-gray-400 mt-3">
                    Check-in membantu TBCare memahami perjalanan
                    pengobatan Anda dari hari ke hari.
                </p>
            </div>

            {/* SUCCESS */}
            {saved && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 px-5 py-4">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />

                    <div>
                        <p className="text-sm font-semibold text-green-700">
                            Check-in berhasil disimpan
                        </p>

                        <p className="text-xs text-green-600 mt-0.5">
                            Data check-in hari ini sudah tercatat.
                        </p>
                    </div>
                </div>
            )}

            {/* ALREADY SAVED */}
            {alreadySaved && !saved && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />

                    <div>
                        <p className="text-sm font-semibold text-blue-700">
                            Check-in hari ini sudah tersimpan
                        </p>

                        <p className="text-xs text-blue-600 mt-0.5">
                            Anda masih bisa memperbarui jawaban lalu
                            menyimpannya kembali.
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>

                {/* KONDISI */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-5">

                    <div className="flex items-center gap-2 mb-5">
                        <MessageCircle className="w-5 h-5 text-blue-600" />

                        <h3 className="font-bold text-gray-900">
                            Bagaimana kondisi Anda hari ini?
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                        {[
                            {
                                value: "Baik",
                                emoji: "😊",
                                description: "Tidak ada keluhan",
                            },
                            {
                                value: "Cukup baik",
                                emoji: "🙂",
                                description: "Ada sedikit keluhan",
                            },
                            {
                                value: "Kurang baik",
                                emoji: "😐",
                                description: "Ada beberapa keluhan",
                            },
                            {
                                value: "Tidak nyaman",
                                emoji: "😣",
                                description: "Merasa cukup terganggu",
                            },
                        ].map((item) => (

                            <button
                                type="button"
                                key={item.value}
                                onClick={() =>
                                    setCondition(item.value)
                                }
                                className={`text-left rounded-2xl border p-4 transition-all ${condition === item.value
                                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                                    : "border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50"
                                    }`}
                            >
                                <div className="text-2xl mb-2">
                                    {item.emoji}
                                </div>

                                <p className="text-sm font-semibold text-gray-900">
                                    {item.value}
                                </p>

                                <p className="text-xs text-gray-400 mt-1">
                                    {item.description}
                                </p>
                            </button>

                        ))}

                    </div>
                </div>

                {/* KELUHAN */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-5">

                    <label className="block font-bold text-gray-900 mb-2">
                        Keluhan yang dirasakan
                    </label>

                    <p className="text-xs text-gray-400 mb-3">
                        Tuliskan keluhan yang ingin Anda catat hari ini.
                    </p>

                    <textarea
                        value={complaints}
                        onChange={(e) =>
                            setComplaints(e.target.value)
                        }
                        rows={4}
                        placeholder="Contoh: merasa mual setelah minum obat..."
                        className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />

                </div>

                {/* KESULITAN */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-5">

                    <label className="block font-bold text-gray-900 mb-2">
                        Apakah ada kesulitan mengikuti pengobatan?
                    </label>

                    <p className="text-xs text-gray-400 mb-4">
                        Pilih yang paling sesuai dengan kondisi Anda.
                    </p>

                    <div className="space-y-2">

                        {[
                            "Tidak ada kesulitan",
                            "Sulit mengikuti jadwal minum obat",
                            "Sering lupa minum obat",
                            "Merasa tidak nyaman setelah minum obat",
                            "Kesulitan lainnya",
                        ].map((item) => (

                            <label
                                key={item}
                                className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${difficulty === item
                                    ? "border-blue-400 bg-blue-50"
                                    : "border-gray-200 hover:bg-gray-50"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="difficulty"
                                    value={item}
                                    checked={
                                        difficulty === item
                                    }
                                    onChange={(e) =>
                                        setDifficulty(
                                            e.target.value
                                        )
                                    }
                                    className="accent-blue-600"
                                />

                                <span className="text-sm text-gray-700">
                                    {item}
                                </span>
                            </label>

                        ))}

                    </div>
                </div>

                {/* CATATAN */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-5">

                    <label className="block font-bold text-gray-900 mb-2">
                        Catatan tambahan
                    </label>

                    <textarea
                        value={notes}
                        onChange={(e) =>
                            setNotes(e.target.value)
                        }
                        rows={4}
                        placeholder="Ada hal lain yang ingin Anda ceritakan?"
                        className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />

                </div>

                {/* BUTTON */}
                <div className="flex justify-end">

                    <button
                        type="submit"
                        className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all"
                    >
                        <Save className="w-4 h-4" />

                        {alreadySaved
                            ? "Perbarui Check-in"
                            : "Simpan Check-in"}
                    </button>

                </div>

            </form>

            {/* DISCLAIMER */}
            <div className="mt-5 rounded-2xl bg-gray-50 border border-gray-100 px-5 py-4">

                <p className="text-xs text-gray-500 leading-relaxed">
                    Informasi check-in digunakan sebagai catatan
                    perjalanan pengobatan. TBCare tidak menggunakan
                    check-in untuk memberikan diagnosis atau mengubah
                    pengobatan Anda.
                </p>

            </div>

        </div>
    );
};

export default CheckInContent;