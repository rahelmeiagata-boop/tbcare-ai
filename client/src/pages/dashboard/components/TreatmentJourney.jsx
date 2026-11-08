import { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    HeartPulse,
    MessageCircle,
    TrendingUp,
} from "lucide-react";
import api from "../../../services/api";

const TreatmentJourney = () => {
    const [checkins, setCheckins] = useState([]);

    useEffect(() => {
        const fetchCheckins = async () => {
            try {
                const response = await api.get("/checkins");
                const data = response.data.data || [];

                setCheckins(
                    [...data].sort(
                        (a, b) =>
                            new Date(b.date) - new Date(a.date)
                    )
                );
            } catch (error) {
                console.error(
                    "Gagal mengambil riwayat check-in:",
                    error
                );
            }
        };

        fetchCheckins();
    }, []);

    const totalCheckins = checkins.length;

    const latestCheckin = checkins[0];

    const goodDays = useMemo(() => {
        return checkins.filter(
            (item) =>
                item.condition === "Baik" ||
                item.condition === "Cukup baik"
        ).length;
    }, [checkins]);

    const consistency =
        totalCheckins > 0
            ? Math.round(
                (goodDays / totalCheckins) * 100
            )
            : 0;

    return (
        <div className="max-w-6xl mx-auto">

            {/* HEADER */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Treatment Journey
                        </h2>

                        <p className="text-sm text-gray-500">
                            Lihat perkembangan perjalanan pengobatan Anda.
                        </p>
                    </div>
                </div>

                <p className="text-sm text-gray-400 mt-3">
                    Riwayat check-in membantu TBCare melihat perubahan
                    kondisi dan pengalaman Anda dari waktu ke waktu.
                </p>
            </div>

            {/* SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <ClipboardCheck className="w-5 h-5 text-blue-600" />
                        </div>

                        <div>
                            <p className="text-xs text-gray-400">
                                Total Check-in
                            </p>

                            <p className="text-2xl font-bold text-gray-900">
                                {totalCheckins}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                            <HeartPulse className="w-5 h-5 text-green-600" />
                        </div>

                        <div>
                            <p className="text-xs text-gray-400">
                                Hari dengan kondisi baik
                            </p>

                            <p className="text-2xl font-bold text-gray-900">
                                {goodDays}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-orange-500" />
                        </div>

                        <div>
                            <p className="text-xs text-gray-400">
                                Konsistensi kondisi
                            </p>

                            <p className="text-2xl font-bold text-gray-900">
                                {consistency}%
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* CURRENT INSIGHT */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">

                <div className="flex items-center gap-2 mb-4">
                    <HeartPulse className="w-5 h-5 text-blue-600" />

                    <h3 className="font-bold text-gray-900">
                        Kondisi Terbaru
                    </h3>
                </div>

                {latestCheckin ? (
                    <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5">

                        <div className="flex items-start justify-between gap-4">

                            <div>
                                <p className="text-xs text-blue-500 mb-1">
                                    Check-in terakhir
                                </p>

                                <p className="text-lg font-bold text-gray-900">
                                    {latestCheckin.condition}
                                </p>
                            </div>

                            <CheckCircle2 className="w-6 h-6 text-blue-600" />
                        </div>

                        {latestCheckin.complaints && (
                            <div className="mt-4">
                                <p className="text-xs text-gray-400 mb-1">
                                    Keluhan
                                </p>

                                <p className="text-sm text-gray-700">
                                    {latestCheckin.complaints}
                                </p>
                            </div>
                        )}

                        {latestCheckin.difficulty && (
                            <div className="mt-3">
                                <p className="text-xs text-gray-400 mb-1">
                                    Kesulitan pengobatan
                                </p>

                                <p className="text-sm text-gray-700">
                                    {latestCheckin.difficulty}
                                </p>
                            </div>
                        )}

                    </div>
                ) : (
                    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-6 text-center">
                        <p className="text-sm text-gray-500">
                            Belum ada data check-in.
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                            Lakukan Daily Check-in terlebih dahulu.
                        </p>
                    </div>
                )}

            </div>

            {/* TIMELINE */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">

                <div className="flex items-center gap-2 mb-6">
                    <CalendarDays className="w-5 h-5 text-blue-600" />

                    <h3 className="font-bold text-gray-900">
                        Riwayat Perjalanan
                    </h3>
                </div>

                {checkins.length === 0 ? (

                    <div className="py-10 text-center">
                        <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />

                        <p className="text-sm font-semibold text-gray-600">
                            Belum ada riwayat
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                            Data akan muncul setelah Anda melakukan
                            Daily Check-in.
                        </p>
                    </div>

                ) : (

                    <div className="space-y-5">

                        {checkins.map((item, index) => {

                            const date = new Date(`${item.date}T00:00:00`);

                            return (
                                <div
                                    key={item.id || index}
                                    className="relative flex gap-4"
                                >

                                    {index !==
                                        checkins.length - 1 && (
                                            <div className="absolute left-[15px] top-8 bottom-[-20px] w-px bg-gray-200" />
                                        )}

                                    <div className="relative z-10 w-8 h-8 rounded-full bg-blue-50 border-4 border-white flex items-center justify-center shrink-0">
                                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                                    </div>

                                    <div className="flex-1 pb-2">

                                        <div className="flex items-start justify-between gap-3">

                                            <div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {item.condition}
                                                </p>

                                                <p className="text-xs text-gray-400 mt-1">
                                                    {date.toLocaleDateString(
                                                        "id-ID",
                                                        {
                                                            day: "numeric",
                                                            month: "long",
                                                            year: "numeric",
                                                        }
                                                    )}
                                                </p>
                                            </div>

                                            {item.difficulty && (
                                                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                                                    {item.difficulty}
                                                </span>
                                            )}

                                        </div>

                                        {item.complaints && (
                                            <div className="mt-3 rounded-xl bg-gray-50 p-3">
                                                <p className="text-xs text-gray-400 mb-1">
                                                    Keluhan
                                                </p>

                                                <p className="text-sm text-gray-700">
                                                    {item.complaints}
                                                </p>
                                            </div>
                                        )}

                                        {item.notes && (
                                            <div className="mt-2 rounded-xl bg-gray-50 p-3">
                                                <p className="text-xs text-gray-400 mb-1">
                                                    Catatan
                                                </p>

                                                <p className="text-sm text-gray-700">
                                                    {item.notes}
                                                </p>
                                            </div>
                                        )}

                                    </div>

                                </div>
                            );
                        })}

                    </div>

                )}

            </div>

            {/* AI PLACEHOLDER */}
            <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-6">

                <div className="flex items-start gap-3">

                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>

                    <div>
                        <h3 className="font-bold text-gray-900">
                            AI Treatment Insight
                        </h3>

                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                            Data perjalanan pengobatan Anda akan dianalisis
                            oleh AI untuk membantu menemukan perubahan pola
                            kepatuhan, keluhan, dan kesulitan selama
                            pengobatan.
                        </p>

                        <p className="text-xs text-gray-500 mt-3">
                            Insight AI tidak digunakan untuk memberikan
                            diagnosis atau mengubah pengobatan.
                        </p>
                    </div>

                </div>

            </div>

        </div>
    );
};

export default TreatmentJourney;