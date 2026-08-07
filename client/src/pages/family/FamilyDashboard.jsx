import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { getFamilyDashboard } from "../../services/familyService";
import { sendReminder } from "../../services/notificationService";

const FamilyDashboard = () => {
  const [patient, setPatient] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await getFamilyDashboard();

        console.log("RESPONSE :", response);

        setPatient(response.data.patient);
        setDashboard(response.data.dashboard);
      } catch (err) {
        console.error(err);
        toast.error("Gagal mengambil dashboard.");
      }
    };

    fetchDashboard();
  }, []);

  const handleSendReminder = async () => {
    try {
      await sendReminder(
        patient.id,
        `Pendamping mengingatkan Anda untuk segera minum obat sesuai jadwal.`
      );

      toast.success(
        "Pengingat berhasil dikirim."
      );

    } catch (err) {
      console.error(err);

      toast.error(
        "Gagal mengirim pengingat."
      );
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">
        Dashboard Pendamping
      </h1>

      <p className="mt-2 text-gray-500">
        Informasi pasien yang Anda dampingi.
      </p>

      <div className="mt-8 rounded-xl border p-6">
        {!patient ? (
          <p>Anda belum terhubung dengan pasien.</p>
        ) : (
          <>
            <h2 className="text-xl font-bold">
              {patient.nama}
            </h2>

            <p className="mt-2">
              Email : {patient.email}
            </p>

            <p>
              Nomor HP : {patient.nomor_hp}
            </p>

            <hr className="my-4" />

            <p>
              Hari Terapi : {dashboard?.therapy_day}
            </p>

            <p>
              Progress Terapi : {dashboard?.therapy_progress}%
            </p>

            <p>
              Kepatuhan Hari Ini : {dashboard?.daily_progress}%
            </p>

            <p>
              Streak : {dashboard?.streak} hari
            </p>

            <p>
              Total Stok : {dashboard?.total_stock} tablet
            </p>
          </>
        )}
      </div>

      <div className="mt-8 rounded-xl border p-6">
        <h2 className="mb-4 text-xl font-bold">
          Jadwal Hari Ini
        </h2>

        {!dashboard ? (
          <p>Memuat data...</p>
        ) : dashboard.today_schedule?.length === 0 ? (
          <p>Tidak ada jadwal hari ini.</p>
        ) : (
          dashboard.today_schedule.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b py-4"
            >
              <div>
                <p className="font-semibold">
                  {item.med_name}
                </p>

                <p className="text-gray-500">
                  {item.scheduled_time}
                </p>
              </div>

              <div className="text-right">
                <span
                  className={`font-semibold ${
                    item.status === "taken"
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {item.status === "taken"
                    ? "Sudah diminum"
                    : "Belum diminum"}
                </span>

                {item.status !== "taken" && (
                  <button
                    onClick={handleSendReminder}
                    className="mt-2 block rounded-lg bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                  >
                    Kirim Pengingat
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FamilyDashboard;