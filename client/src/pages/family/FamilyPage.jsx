import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  getFamilies,
  addFamily,
  deleteFamily,
} from "../../services/familyService";

const FamilyPage = () => {
  const [email, setEmail] = useState("");
  const [families, setFamilies] = useState([]);

  const fetchFamilies = async () => {
    try {
      const response = await getFamilies();
      setFamilies(response.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengambil data keluarga.");
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, []);

  const handleTambah = async () => {

  if (!email.trim()) {
    toast.error("Email wajib diisi.");
    return;
  }

  try {

    await addFamily(email);

    toast.success("Anggota keluarga berhasil ditambahkan.");

    setEmail("");

    fetchFamilies();

  } catch (err) {

    console.error(err);

    toast.error(
      err.response?.data?.message ||
      "Gagal menambahkan anggota keluarga."
    );

  }

};
  const handleHapus = async (id) => {
    if (!window.confirm("Hapus anggota keluarga?")) return;

    try {
      await deleteFamily(id);

      toast.success("Anggota keluarga berhasil dihapus.");

      fetchFamilies();
    } catch (err) {
      console.error(err);

      toast.error("Gagal menghapus anggota keluarga.");
    }
  };

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold">
          Family Monitoring
        </h1>

        <p className="text-gray-500">
          Hubungkan akun keluarga menggunakan email.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-6">

        <h2 className="font-semibold mb-4">
          Tambah Anggota
        </h2>

        <div className="flex gap-3">

          <input
            type="email"
            value={email}
            placeholder="Masukkan email..."
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 border rounded-lg px-4 py-3"
          />

          <button
            onClick={handleTambah}
            className="bg-blue-600 text-white px-6 rounded-lg"
          >
            Tambah
          </button>

        </div>

      </div>

      <div className="bg-white rounded-xl shadow p-6">

        <h2 className="font-semibold mb-4">
          Daftar Anggota
        </h2>

        {families.length === 0 ? (
          <p className="text-gray-500">
            Belum ada anggota keluarga.
          </p>
        ) : (
          <div className="space-y-3">

            {families.map((family) => (

              <div
                key={family.id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >

                <div>
                  <h3 className="font-semibold">
                    {family.nama}
                  </h3>

                  <p className="text-gray-500 text-sm">
                    {family.email}
                  </p>
                </div>

                <button
                  onClick={() => handleHapus(family.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                  Hapus
                </button>

              </div>

            ))}

          </div>
        )}

      </div>

    </div>
  );
};

export default FamilyPage;