import { useEffect, useState } from "react";
import { Copy, Link2, UsersRound } from "lucide-react";
import toast from "react-hot-toast";

import { getFamilies, deleteFamily } from "../../services/familyService";

const readCurrentUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
        return {};
    }
};

const FamilyPage = () => {
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [me] = useState(readCurrentUser);

    useEffect(() => {
        let active = true;

        const load = async () => {
            try {
                const response = await getFamilies();

                if (active) setFamilies(response.data || []);
            } catch (err) {
                console.error("GET FAMILY ERROR:", err);

                if (active) toast.error("Gagal mengambil data pendamping.");
            } finally {
                if (active) setLoading(false);
            }
        };

        load();

        return () => {
            active = false;
        };
    }, []);

    const handleCopyUsername = async () => {
        try {
            await navigator.clipboard.writeText(me.username);
            toast.success("Username disalin.");
        } catch {
            toast.error("Tidak dapat menyalin. Salin username secara manual.");
        }
    };

    const handleHapus = async (id) => {
        const yakin = window.confirm(
            "Hapus pendamping ini? Ia tidak akan bisa lagi memantau data Anda."
        );

        if (!yakin) return;

        try {
            await deleteFamily(id);

            toast.success("Pendamping berhasil dihapus.");

            const response = await getFamilies();
            setFamilies(response.data || []);
        } catch (err) {
            console.error("DELETE FAMILY ERROR:", err);

            toast.error(
                err.response?.data?.message ||
                "Gagal menghapus pendamping."
            );
        }
    };

    return (
        <div
            className="w-full"
            style={{
                fontFamily: "'Poppins', sans-serif",
            }}
        >
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
                `}
            </style>

            {/* CARD HUBUNGKAN PENDAMPING */}
            <section className="w-full bg-white rounded-3xl p-7 md:p-8 shadow-[0_4px_18px_rgba(15,23,42,0.08)] border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Link2 className="w-5 h-5 text-blue-600" strokeWidth={2} />
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                        Hubungkan Pendamping
                    </h2>
                </div>

                <p className="text-sm md:text-base text-gray-500 leading-relaxed">
                    Pendamping yang terhubung dapat memantau kepatuhan minum obat Anda dan
                    mengirim pengingat. Hubungan dimulai dari akun pendamping, bukan dari akun Anda.
                </p>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Akun Anda
                        </p>

                        <p className="mt-2 font-semibold text-gray-900 break-words">
                            {me.nama || "-"}
                        </p>

                        <p className="text-sm text-gray-500 break-words">
                            {me.email || "-"}
                        </p>

                        {me.username && (
                            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white border border-slate-200 px-4 py-3">
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-400">Username untuk dicari pendamping</p>
                                    <p className="font-semibold text-blue-700 break-all">@{me.username}</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCopyUsername}
                                    aria-label="Salin username"
                                    className="shrink-0 h-10 w-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-gray-800">
                            Minta pendamping Anda melakukan langkah berikut:
                        </p>

                        <ol className="mt-3 space-y-3 text-sm text-gray-600">
                            {[
                                "Masuk ke TBCare dengan akun yang berperan sebagai Pendamping.",
                                "Di bagian \"Hubungkan Akun Pasien\", cari nama atau username Anda lewat tombol \"Cari Pasien\".",
                                "Pilih akun Anda, lalu tekan \"Hubungkan Akun\" dan konfirmasi.",
                            ].map((step, index) => (
                                <li key={step} className="flex items-start gap-3">
                                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                                        {index + 1}
                                    </span>
                                    <span className="leading-relaxed">{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </section>

            {/* CARD PENDAMPING TERHUBUNG */}
            <section className="w-full mt-6 bg-white rounded-3xl p-7 md:p-8 shadow-[0_4px_18px_rgba(15,23,42,0.08)] border border-slate-100">
                <div className="flex items-center gap-3 mb-7">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                        <UsersRound className="w-5 h-5 text-teal-600" strokeWidth={2} />
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                        Pendamping Terhubung
                    </h2>
                </div>

                {loading ? (
                    <div className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-6 py-10 text-center">
                        <p className="text-sm text-gray-500">Memuat data pendamping...</p>
                    </div>
                ) : families.length === 0 ? (
                    <div className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-6 py-10 text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                            <UsersRound className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
                        </div>

                        <h3 className="text-base md:text-lg font-semibold text-gray-800">
                            Belum ada pendamping yang terhubung
                        </h3>

                        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
                            Bagikan nama atau username Anda kepada pendamping agar ia dapat
                            menghubungkan akunnya, lalu muat ulang halaman ini.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {families.map((family) => (
                            <div
                                key={family.id}
                                className="border border-slate-200 rounded-2xl p-4 flex justify-between items-center gap-4"
                            >
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-gray-900 break-words">
                                        {family.nama}
                                    </h3>

                                    <p className="text-sm text-gray-500 break-words">
                                        {family.email}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleHapus(family.id)}
                                    className="shrink-0 px-4 py-2 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100"
                                >
                                    Hapus
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default FamilyPage;
