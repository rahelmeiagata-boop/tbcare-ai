import { useEffect, useState } from "react";
import { UserPlus, UsersRound, Search, UserRound, X } from "lucide-react";
import toast from "react-hot-toast";

import {
  getFamilies,
  addFamily,
  deleteFamily,
  searchFamily,
} from "../../../services/familyService";

const FamilyContent = () => {
  const [keyword, setKeyword] = useState("");
  const [families, setFamilies] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [connecting, setConnecting] = useState(false);

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

  // Pencarian akun pendamping
  useEffect(() => {
    if (keyword.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let active = true;

    const timer = setTimeout(async () => {
      try {
        setSearching(true);

        const response = await searchFamily(keyword.trim());

        if (active) {
          const results = response.data || [];

          const connectedIds = families.map(
            (family) => Number(family.family_id)
          );

          setSearchResults(
            results.filter(
              (account) =>
                !connectedIds.includes(Number(account.id))
            )
          );
        }
      } catch (err) {
        if (active) {
          console.error("SEARCH FAMILY ERROR:", err);
          setSearchResults([]);
        }
      } finally {
        if (active) {
          setSearching(false);
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [keyword, families]);

  // Hubungkan akun setelah konfirmasi
  const handleHubungkan = async () => {
    if (!selectedFamily) return;

    const yakin = window.confirm(
      `Hubungkan akun ${selectedFamily.nama} sebagai pendamping?`
    );

    if (!yakin) return;

    try {
      setConnecting(true);

      await addFamily(selectedFamily.id);

      toast.success("Akun pendamping berhasil dihubungkan.");

      setKeyword("");
      setSearchResults([]);
      setSelectedFamily(null);

      await fetchFamilies();
    } catch (err) {
      console.error("CONNECT FAMILY ERROR:", err);

      toast.error(
        err.response?.data?.message ||
        "Gagal menghubungkan akun."
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleHapus = async (id) => {
    const yakin = window.confirm(
      "Hapus anggota keluarga ini?"
    );

    if (!yakin) return;

    try {
      await deleteFamily(id);
      toast.success("Anggota keluarga berhasil dihapus.");
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
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        `}
      </style>

      {/* TAMBAH ANGGOTA */}
      <section className="w-full rounded-3xl border border-slate-100 bg-white p-7 shadow-[0_4px_18px_rgba(15,23,42,0.08)] md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <UserPlus className="h-5 w-5 text-blue-600" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
            Tambah Anggota
          </h2>
        </div>

        <div className="relative">
          <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 px-5 shadow-sm transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
            <Search className="h-5 w-5 shrink-0 text-slate-400" />

            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setSelectedFamily(null);
              }}
              placeholder="Cari nama atau username pendamping..."
              className="h-full w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 md:text-base"
            />

            {keyword && (
              <button
                type="button"
                onClick={() => {
                  setKeyword("");
                  setSelectedFamily(null);
                  setSearchResults([]);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {keyword.trim().length >= 2 && !selectedFamily && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {searching ? (
                <p className="p-5 text-center text-sm text-slate-500">
                  Mencari akun...
                </p>
              ) : searchResults.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {searchResults.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setSelectedFamily(account)}
                      className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-blue-50"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <UserRound size={21} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">
                          {account.nama}
                        </p>

                        <p className="text-sm text-slate-500">
                          @{account.username}
                        </p>
                      </div>

                      <span className="text-sm font-semibold text-blue-600">
                        Lihat
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="p-5 text-center text-sm text-slate-500">
                  Akun pendamping tidak ditemukan.
                </p>
              )}
            </div>
          )}
        </div>

        {/* DETAIL AKUN */}
        {selectedFamily && (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                Detail Akun Pendamping
              </h3>

              <button
                type="button"
                onClick={() => setSelectedFamily(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <UserRound size={26} />
              </div>

              <div>
                <p className="font-bold text-gray-900">
                  {selectedFamily.nama}
                </p>

                <p className="text-sm text-slate-500">
                  @{selectedFamily.username}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-xl bg-white p-4">
              <div>
                <p className="text-xs text-slate-400">Nama Lengkap</p>
                <p className="text-sm font-medium text-gray-800">
                  {selectedFamily.nama}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Username</p>
                <p className="text-sm font-medium text-gray-800">
                  @{selectedFamily.username}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-sm font-medium text-gray-800">
                  {selectedFamily.email}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Jenis Akun</p>
                <p className="text-sm font-medium capitalize text-gray-800">
                  {selectedFamily.role}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleHubungkan}
              disabled={connecting}
              className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {connecting ? "Menghubungkan..." : "Hubungkan Akun"}
            </button>
          </div>
        )}
      </section>

      {/* DAFTAR ANGGOTA */}
      <section className="mt-6 w-full rounded-3xl border border-slate-100 bg-white p-7 shadow-[0_4px_18px_rgba(15,23,42,0.08)] md:p-8">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50">
            <UsersRound className="h-5 w-5 text-teal-600" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
            Daftar Anggota
          </h2>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-10 text-center">
            <p className="text-sm text-gray-500">
              Memuat data keluarga...
            </p>
          </div>
        ) : families.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <UsersRound className="h-7 w-7 text-slate-400" />
            </div>

            <h3 className="text-base font-semibold text-gray-800 md:text-lg">
              Belum ada anggota keluarga
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
              Cari akun pendamping berdasarkan nama atau username untuk mulai melakukan pemantauan.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {families.map((family) => (
              <div
                key={family.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"
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
                  onClick={() => handleHapus(family.id)}
                  className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
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

export default FamilyContent;