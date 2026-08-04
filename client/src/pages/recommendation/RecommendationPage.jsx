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

    const fetchRecommendation = async () => {
        try {
            const response = await getRecommendation();
            setData(response.data);
        } catch (err) {
            console.error(err);
            toast.error("Gagal mengambil rekomendasi.");
        } finally {
            setLoading(false);
        }
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

    const routine = data.routine;
    const medications = data.medications;

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

                        <div className="flex justify-between items-center">

                            <div>

                                <h2 className="text-xl font-bold">
                                    {item.med_name}
                                </h2>

                                <p className="text-gray-500">
                                    {item.dosage} • {item.frequency}
                                </p>

                            </div>

                            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full">
                                {item.consumption_rule}
                            </span>

                        </div>

                        <div className="mt-6">

                            <label className="font-semibold">
                                Jam yang Direkomendasikan
                            </label>

                            <input
                                type="time"
                                defaultValue={item.recommended_time}
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