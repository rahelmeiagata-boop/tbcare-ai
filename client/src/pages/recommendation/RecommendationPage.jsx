import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
    getRecommendation,
    saveRecommendation,
} from "../../services/recommendationService";

const RecommendationPage = () => {
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecommendation();
    }, []);

    const fetchRecommendation = async () => {
        try {
            const response = await getRecommendation();

            console.log("DATA REKOMENDASI:", response.data);

            setData(response.data);
        } catch (err) {
            console.error(err);
            toast.error("Gagal mengambil rekomendasi.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSchedule = async () => {
        try {
            await saveRecommendation();

            toast.success("Jadwal berhasil disimpan.");

            navigate("/dashboard");
        } catch (err) {
            console.error(err);

            toast.error("Gagal menyimpan jadwal.");
        }
    };

    const formatConsumptionRule = (rule) => {
        if (!rule) {
            return "Sesuai rekomendasi AI";
        }

        let rules = [];

        /*
         * CASE 1
         * Backend mengirim array langsung:
         * ["before_breakfast", "before_lunch"]
         */
        if (Array.isArray(rule)) {
            rules = rule;
        }

        /*
         * CASE 2
         * Backend mengirim JSON string:
         * '["before_breakfast","before_lunch"]'
         */
        else if (typeof rule === "string") {
            const value = rule.trim();

            if (value.startsWith("[") && value.endsWith("]")) {
                try {
                    const parsed = JSON.parse(value);

                    if (Array.isArray(parsed)) {
                        rules = parsed;
                    }
                } catch (error) {
                    console.error(
                        "Gagal parsing consumption_rule:",
                        error
                    );
                }
            }

            /*
             * CASE 3
             * Backend mengirim:
             * {before_breakfast,before_lunch,before_dinner}
             */
            if (rules.length === 0 && value.startsWith("{")) {
                const cleanValue = value
                    .replace(/^{|}$/g, "");

                rules = cleanValue
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean);
            }

            /*
             * CASE 4
             * Backend mengirim satu nilai:
             * before_breakfast
             */
            if (rules.length === 0) {
                rules = [value];
            }
        }

        const labels = {
            before_breakfast: "Sebelum Sarapan",
            after_breakfast: "Setelah Sarapan",

            before_lunch: "Sebelum Makan Siang",
            after_lunch: "Setelah Makan Siang",

            before_dinner: "Sebelum Makan Malam",
            after_dinner: "Setelah Makan Malam",

            before_meal: "Sebelum Makan",
            after_meal: "Setelah Makan",

            before_food: "Sebelum Makan",
            after_food: "Setelah Makan",

            with_food: "Bersama Makanan",
            with_meal: "Bersama Makanan",

            empty_stomach: "Saat Perut Kosong",

            bedtime: "Sebelum Tidur",

            morning: "Pagi Hari",
            afternoon: "Siang Hari",
            evening: "Sore Hari",
            night: "Malam Hari",
        };

        const formattedRules = rules
            .map((item) => {
                if (!item) {
                    return null;
                }

                const cleanItem = String(item)
                    .trim()
                    .replace(/^["']|["']$/g, "")
                    .toLowerCase();

                return labels[cleanItem] || cleanItem;
            })
            .filter(Boolean);

        if (formattedRules.length === 0) {
            return "Sesuai rekomendasi AI";
        }

        return formattedRules.join(" • ");
    };

    if (loading) {
        return (
            <h2 className="text-center mt-10">
                Memuat rekomendasi...
            </h2>
        );
    }

    if (!data) {
        return (
            <h2 className="text-center mt-10">
                Tidak ada data.
            </h2>
        );
    }

    const medications = data.medications || [];

    return (
        <div className="max-w-5xl mx-auto p-8">

            <h1 className="text-3xl font-bold text-blue-700 mb-2">
                🤖 Rekomendasi Jadwal AI
            </h1>

            <p className="text-gray-500 mb-8">
                Berdasarkan rutinitas harian Anda.
            </p>

            <div className="space-y-6">

                {medications.map((item) => (

                    <div
                        key={item.id}
                        className="bg-white rounded-xl shadow p-6"
                    >

                        <div className="flex justify-between items-center gap-4">

                            <div>
                                <h2 className="text-xl font-bold">
                                    {item.med_name}
                                </h2>

                                <p className="text-gray-500">
                                    {item.dosage} • {item.frequency}
                                </p>
                            </div>

                            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium text-center">
                                {formatConsumptionRule(
                                    item.consumption_rule
                                )}
                            </span>

                        </div>

                        <div className="mt-6">

                            <label className="font-semibold">
                                Jam yang Direkomendasikan
                            </label>

                            <input
                                type="time"
                                defaultValue={
                                    item.recommended_time
                                }
                                className="w-full border rounded-lg p-3 mt-2"
                            />

                        </div>

                        <p className="mt-4 text-gray-500">
                            AI akan menghitung jadwal berdasarkan rutinitas pengguna.
                        </p>

                    </div>

                ))}

            </div>

            <button
                onClick={handleSaveSchedule}
                className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-lg font-bold"
            >
                Gunakan Jadwal Ini
            </button>

        </div>
    );
};

export default RecommendationPage;