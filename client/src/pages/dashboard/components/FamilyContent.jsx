import { useState } from "react";

const FamilyContent = () => {
  const [email, setEmail] = useState("");

  const handleTambah = () => {
    alert(
      "Nanti tombol ini akan memanggil API tambah keluarga."
    );
  };

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-2xl font-bold">
          Family Monitoring
        </h2>

        <p className="text-gray-500 mt-2">
          Hubungkan akun anggota keluarga untuk memantau kepatuhan pasien.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-6">

        <h3 className="font-semibold text-lg mb-4">
          Tambah Anggota Keluarga
        </h3>

        <input
          type="email"
          placeholder="Masukkan email anggota keluarga"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg px-4 py-3"
        />

        <button
          onClick={handleTambah}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Tambah
        </button>

      </div>

      <div className="bg-white rounded-xl shadow p-6">

        <h3 className="font-semibold text-lg mb-4">
          Daftar Anggota
        </h3>

        <div className="border rounded-lg p-4 flex justify-between items-center">

          <div>
            <h4 className="font-semibold">
              Belum ada anggota keluarga
            </h4>

            <p className="text-gray-500 text-sm">
              Tambahkan anggota keluarga menggunakan email.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default FamilyContent;