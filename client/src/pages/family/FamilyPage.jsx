import { useEffect, useState } from "react";
import { UserPlus, UsersRound } from "lucide-react";
import toast from "react-hot-toast";

import {
    getFamilies,
    searchFamily,
    addFamily,
    deleteFamily,
} from "../../services/familyService";

const FamilyPage = () => {
    const [keyword, setKeyword] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [searching, setSearching] = useState(false);
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFamilies = async () => {
        try {
            const response = await getFamilies();

            setFamilies(response.data || []);
        } catch (err) {
            console.error("GET FAMILY ERROR:", err);

            toast.error("Gagal mengambil data keluarga.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFamilies();
    }, []);

    const handleSearch = async () => {
        if (!keyword.trim()) {
            toast.error("Masukkan nama atau username terlebih dahulu.");
            return;
        }

        try {
            setSearching(true);
            const response = await searchFamily(keyword.trim());
            setSearchResults(response.data || []);

            if (!response.data?.length) {
                toast.error("Akun pendamping tidak ditemukan.");
            }
        } catch (err) {
            console.error("SEARCH FAMILY ERROR:", err);
            toast.error("Gagal mencari akun.");
        } finally {
            setSearching(false);
        }
    };

    const handleTambah = async () => {
        if (!selectedFamily) return;

        const yakin = window.confirm(
            `Hubungkan akun ${selectedFamily.nama} (@${selectedFamily.username}) sebagai pendamping?`
        );

        if (!yakin) return;

        try {
            await addFamily(selectedFamily.id);

            toast.success("Akun pendamping berhasil dihubungkan.");

            setKeyword("");
            setSearchResults([]);
            setSelectedFamily(null);

            await fetchFamilies();
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                "Gagal menghubungkan akun."
            );
        }
    };

    const handleHapus = async (id) => {
        const yakin = window.confirm(
            "Hapus anggota keluarga ini?"
        );

        if (!yakin) return;

        try {
            await deleteFamily(id);

            toast.success(
                "Anggota keluarga berhasil dihapus."
            );

            await fetchFamilies();
        } catch (err) {
            console.error("DELETE FAMILY ERROR:", err);

            toast.error(
                err.response?.data?.message ||
                "Gagal menghapus anggota keluarga."
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

            {/* CARD TAMBAH ANGGOTA */}
            <section
                className="
                    w-full
                    bg-white
                    rounded-3xl
                    p-7
                    md:p-8
                    shadow-[0_4px_18px_rgba(15,23,42,0.08)]
                    border
                    border-slate-100
                "
            >
                <div className="flex items-center gap-3 mb-6">
                    <div
                        className="
                            w-10
                            h-10
                            rounded-xl
                            bg-blue-50
                            flex
                            items-center
                            justify-center
                            shrink-0
                        "
                    >
                        <UserPlus
                            className="w-5 h-5 text-blue-600"
                            strokeWidth={2}
                        />
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                        Tambah Anggota
                    </h2>
                </div>

                <div className="flex flex-col lg:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Masukkan nama atau username pendamping..."
                        value={keyword}
                        onChange={(e) => {
                            setKeyword(e.target.value);
                            setSearchResults([]);
                            setSelectedFamily(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSearch();
                        }}
                        className="flex-1 h-14 px-5 rounded-2xl bg-white border border-slate-200 text-gray-800 text-sm md:text-base outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 shadow-sm"
                    />

                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={searching}
                        className="h-14 px-9 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {searching ? "Mencari..." : "Cari Akun"}
                    </button>
                </div>

                {searchResults.length > 0 && (
                    <div className="mt-5 space-y-3">
                        <h3 className="font-semibold text-gray-800">
                            Hasil Pencarian
                        </h3>

                        {searchResults.map((family) => (
                            <button
                                key={family.id}
                                type="button"
                                onClick={() => setSelectedFamily(family)}
                                className={`w-full text-left p-4 rounded-2xl border transition ${selectedFamily?.id === family.id
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                <p className="font-semibold text-gray-900">
                                    {family.nama}
                                </p>
                                <p className="text-sm text-blue-600">
                                    @{family.username}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {family.email}
                                </p>
                            </button>
                        ))}
                    </div>
                )}

                {selectedFamily && (
                    <div className="mt-5 p-5 rounded-2xl border border-blue-200 bg-blue-50">
                        <h3 className="font-bold text-gray-900">
                            Detail Akun Pendamping
                        </h3>

                        <p className="mt-3 text-sm text-gray-700">
                            Nama: {selectedFamily.nama}
                        </p>
                        <p className="text-sm text-gray-700">
                            Username: @{selectedFamily.username}
                        </p>
                        <p className="text-sm text-gray-700">
                            Email: {selectedFamily.email}
                        </p>
                        <p className="text-sm text-gray-700">
                            Tipe akun: {selectedFamily.role}
                        </p>

                        <button
                            type="button"
                            onClick={handleTambah}
                            className="mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
                        >
                            Hubungkan Akun
                        </button>
                    </div>
                )}
            </section>

            {/* CARD DAFTAR ANGGOTA */}
            <section
                className="
                    w-full
                    mt-6
                    bg-white
                    rounded-3xl
                    p-7
                    md:p-8
                    shadow-[0_4px_18px_rgba(15,23,42,0.08)]
                    border
                    border-slate-100
                "
            >
                <div className="flex items-center gap-3 mb-7">
                    <div
                        className="
                            w-10
                            h-10
                            rounded-xl
                            bg-teal-50
                            flex
                            items-center
                            justify-center
                            shrink-0
                        "
                    >
                        <UsersRound
                            className="w-5 h-5 text-teal-600"
                            strokeWidth={2}
                        />
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                        Daftar Anggota
                    </h2>
                </div>

                {loading ? (
                    <div
                        className="
                            w-full
                            rounded-2xl
                            bg-slate-50
                            border
                            border-slate-100
                            px-6
                            py-10
                            text-center
                        "
                    >
                        <p className="text-sm text-gray-500">
                            Memuat data keluarga...
                        </p>
                    </div>
                ) : families.length === 0 ? (
                    <div
                        className="
                            w-full
                            rounded-2xl
                            bg-slate-50
                            border
                            border-slate-100
                            px-6
                            py-10
                            text-center
                        "
                    >
                        <div
                            className="
                                w-16
                                h-16
                                mx-auto
                                rounded-full
                                bg-white
                                shadow-sm
                                flex
                                items-center
                                justify-center
                                mb-4
                            "
                        >
                            <UsersRound
                                className="w-7 h-7 text-slate-400"
                                strokeWidth={1.8}
                            />
                        </div>

                        <h3 className="text-base md:text-lg font-semibold text-gray-800">
                            Belum ada anggota keluarga
                        </h3>

                        <p
                            className="
                                text-sm
                                text-gray-500
                                mt-2
                                max-w-md
                                mx-auto
                                leading-relaxed
                            "
                        >
                            Tambahkan anggota keluarga menggunakan email
                            untuk mulai melakukan pemantauan.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {families.map((family) => (
                            <div
                                key={family.id}
                                className="
                                    border
                                    border-slate-200
                                    rounded-2xl
                                    p-4
                                    flex
                                    justify-between
                                    items-center
                                    gap-4
                                "
                            >
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        {family.nama}
                                    </h3>

                                    <p className="text-sm text-gray-500">
                                        {family.email}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleHapus(family.id)
                                    }
                                    className="
                                        px-4
                                        py-2
                                        rounded-xl
                                        bg-red-50
                                        text-red-600
                                        font-semibold
                                        text-sm
                                        hover:bg-red-100
                                    "
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