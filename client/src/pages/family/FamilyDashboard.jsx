import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BellPlus, Phone } from "lucide-react";
import { getFamilyDashboard } from "../../services/familyService";
import { sendReminder } from "../../services/notificationService";


const TOTAL_THERAPY_DAYS = 180;

const CHART_LABELS = [
  "18 Juni",
  "19 Juni",
  "20 Juni",
  "21 Juni",
  "22 Juni",
  "23 Juni",
  "24 Juni",
];

const INITIAL_CHART_DATA = [
  2,
  22,
  22,
  35,
  35,
  50,
  50,
];

const TARGET_LINE_DATA = [
  5,
  35,
  35,
  55,
  55,
  75,
  90,
];

const DEMO_PATIENT = {
  id: 1,
  nama: "Ayah",
  email: "ayah@gmail.com",
  nomor_hp: "081234567890",
};

const DEMO_DASHBOARD = {
  therapy_day: 153,
  therapy_progress: 85,
  daily_progress: 85,
  streak: 153,
  total_stock: 14,

  today_schedule: [
    {
      id: 1,
      scheduled_time: "08:00",
      med_name: "Rifampisin 600 Mg",
      status: "taken",
    },
    {
      id: 2,
      scheduled_time: "08:00",
      med_name: "Pirazinamid 500 Mg",
      status: "pending",
    },
  ],
};

function DashboardHeader({
  isNotifOpen,
  onToggleNotif,
}) {
  return (
    <header className="flex h-[100px] items-center justify-between bg-white px-8 lg:px-10">
      <div>
        <h1 className="text-[30px] font-extrabold uppercase leading-none tracking-tight text-slate-950">
          Selamat Datang, Pendamping!
        </h1>

        <p className="mt-2 text-[14px] text-slate-600">
          Dapatkan informasi terbaru dari pasien!
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative">
          <button
            type="button"
            onClick={onToggleNotif}
            aria-label="Notifikasi"
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-950 transition hover:bg-slate-100"
          >
            <BellPlus
              size={28}
              strokeWidth={2}
            />

            <span className="absolute right-[3px] top-[3px] h-2.5 w-2.5 rounded-full bg-red-500" />
          </button>

          {isNotifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={onToggleNotif}
              />

              <div className="absolute right-0 top-14 z-50 w-[280px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <p className="text-sm font-bold text-slate-900">
                  Notifikasi
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Belum ada notifikasi baru.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200">
            <span className="text-sm font-semibold text-slate-500">
              RM
            </span>
          </div>

          <span className="text-[14px] font-semibold text-slate-800">
            Username
          </span>
        </div>
      </div>
    </header>
  );
}

function ScheduleCard({
  dashboard,
  onSendReminder,
}) {
  const formattedDate =
    new Date().toLocaleDateString(
      "id-ID",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );

  return (
    <div className="flex h-[385px] w-full flex-col rounded-[24px] bg-white p-6 shadow-[0_4px_12px_rgba(15,23,42,0.15)]">
      <div>
        <h2 className="text-[22px] font-bold leading-tight text-slate-950">
          Jadwal Konsumsi Pasien Hari Ini
        </h2>

        <p className="mt-1 text-[14px] text-slate-500">
          {formattedDate}
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-300">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr>
              <th className="w-[135px] border-b border-r border-slate-300 px-3 py-2.5 text-center font-medium text-slate-700">
                Waktu
              </th>

              <th className="border-b border-r border-slate-300 px-3 py-2.5 text-left font-medium text-slate-700">
                Nama Obat
              </th>

              <th className="w-[145px] border-b border-slate-300 px-3 py-2.5 text-center font-medium text-slate-700">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {dashboard?.today_schedule
              ?.slice(0, 4)
              .map((item) => {
                const isTaken =
                  item.status === "taken";

                return (
                  <tr
                    key={item.id}
                    className="bg-white"
                  >
                    <td className="border-b border-r border-slate-300 px-3 py-2.5 text-center text-slate-800">
                      {item.scheduled_time}
                    </td>

                    <td className="border-b border-r border-slate-300 px-3 py-2.5 text-slate-800">
                      {item.med_name}
                    </td>

                    <td className="border-b border-slate-300 px-3 py-2.5 text-center">
                      {isTaken ? (
                        <span className="text-[13px] font-semibold text-blue-600">
                          Sudah Minum
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={onSendReminder}
                          className="text-[13px] font-semibold text-red-500 transition hover:text-red-600 hover:underline"
                        >
                          Belum Minum
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="mt-auto flex justify-center pt-5">
        <button
          type="button"
          onClick={() =>
            alert(
              "Menampilkan jadwal lengkap pasien."
            )
          }
          className="rounded-full bg-gradient-to-r from-[#46d9c8] to-[#20bca9] px-8 py-3 text-[15px] font-semibold text-white shadow-[0_4px_10px_rgba(20,184,166,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        >
          Lihat Jadwal Selengkapnya
        </button>
      </div>
    </div>
  );
}

function TherapyProgressCard({
  dashboard,
}) {
  const percent = Number(
    dashboard?.therapy_progress ?? 0
  );

  const therapyDay = Number(
    dashboard?.therapy_day ?? 0
  );

  const radius = 52;

  const circumference =
    2 * Math.PI * radius;

  const dashOffset =
    circumference -
    (percent / 100) *
      circumference;

  return (
    <div className="flex h-[385px] w-full flex-col items-center rounded-[24px] bg-white px-4 py-6 shadow-[0_4px_12px_rgba(15,23,42,0.15)]">
      <h2 className="text-center text-[20px] font-bold leading-tight text-slate-950">
        Progres Terapi
        <br />
        Pasien
      </h2>

      <div className="mt-6 flex justify-center">
        <div className="relative h-[140px] w-[140px]">
          <svg
            viewBox="0 0 120 120"
            className="h-full w-full -rotate-90"
          >
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="10"
            />

            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#16B89A"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[29px] font-extrabold text-slate-950">
              {percent}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-[17px] font-bold text-slate-900">
          {therapyDay}/180
        </p>

        <p className="text-[16px] font-semibold text-slate-900">
          Hari
        </p>
      </div>

      <p className="mt-6 text-center text-[12px] leading-5 text-slate-400">
        Kepatuhan Pasien
        <br />
        Mencapai {percent}% Hari Ini
      </p>
    </div>
  );
}

function ComplianceBadgeCard({
  dashboard,
}) {
  const streak =
    dashboard?.streak ?? 0;

  return (
    <div className="h-[170px] w-full rounded-[24px] bg-white px-6 py-5 shadow-[0_4px_12px_rgba(15,23,42,0.15)]">
      <h3 className="text-[19px] font-bold leading-tight text-slate-950">
        Badge Kepatuhan
        <br />
        Pasien
      </h3>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-[33px] font-extrabold leading-none text-slate-950">
          {streak}
        </span>

        <span className="text-[17px] font-semibold text-slate-900">
          Hari
        </span>
      </div>

      <p className="mt-1 text-[14px] text-slate-900">
        Berturut-turut
      </p>
    </div>
  );
}

function RemainingStockCard({
  dashboard,
}) {
  const stock =
    dashboard?.total_stock ?? 0;

  return (
    <div className="h-[125px] w-full rounded-[24px] bg-white px-6 py-5 shadow-[0_4px_12px_rgba(15,23,42,0.15)]">
      <h3 className="text-[18px] font-bold leading-tight text-slate-950">
        Sisa Obat
        <br />
        Pasien
      </h3>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-[32px] font-extrabold leading-none text-slate-950">
            {stock}
          </span>

          <span className="text-[17px] font-semibold text-slate-900">
            Tablet
          </span>
        </div>

        <div className="relative mr-1 h-[18px] w-[42px] rotate-[-8deg] rounded-full border-[4px] border-cyan-400">
          <div className="absolute left-1/2 top-1/2 h-[4px] w-[27px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300" />
        </div>
      </div>
    </div>
  );
}

function WhatsappBanner() {
  return (
    <div className="h-[125px] w-full rounded-[24px] bg-white px-5 py-5 shadow-[0_4px_12px_rgba(15,23,42,0.15)]">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500">
          <Phone
            className="h-6 w-6 text-white"
            strokeWidth={2}
          />
        </div>

        <div className="min-w-0">
          <h3 className="text-[18px] font-bold text-slate-950">
            Notifikasi Aktif
          </h3>

          <p className="mt-1 text-[13px] text-slate-400">
            Ingatkan pasien!
          </p>

          <p className="text-[12px] leading-4 text-slate-400">
            Notifikasi akan dikirim
            <br />
            melalui WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
}

const CHART_PATH_LENGTH = 1400;

function ComplianceChartCard({
  dashboard,
}) {
  const [chartData, setChartData] =
    useState(
      INITIAL_CHART_DATA
    );

  const [isDrawn, setIsDrawn] =
    useState(false);

  useEffect(() => {
    const timer = setTimeout(
      () => setIsDrawn(true),
      100
    );

    return () =>
      clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (
      dashboard?.daily_progress !=
      null
    ) {
      setChartData((prev) => {
        const next = [...prev];

        next[next.length - 1] =
          Number(
            dashboard.daily_progress
          );

        return next;
      });
    }
  }, [
    dashboard?.daily_progress,
  ]);

  const width = 650;
  const height = 250;

  const xStep =
    width /
    (CHART_LABELS.length - 1);

  const toPoints = (series) =>
    series
      .map((value, index) => {
        const x =
          index * xStep;

        const y =
          height -
          (value / 100) * height;

        return `${x},${y}`;
      })
      .join(" ");

  const drawStyle = (
    delaySeconds
  ) => ({
    strokeDasharray:
      CHART_PATH_LENGTH,
    strokeDashoffset: isDrawn
      ? 0
      : CHART_PATH_LENGTH,
    transition: `stroke-dashoffset 1.4s ease-out ${delaySeconds}s`,
  });

  return (
    <div className="rounded-[24px] bg-white p-6 shadow-[0_4px_12px_rgba(15,23,42,0.10)]">
      <h2 className="text-[21px] font-bold text-slate-950">
        Diagram Kepatuhan Pasien
      </h2>

      <div
        className="mt-5 rounded-[22px] p-4"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(203,213,225,0.42) 2px, transparent 2px)",
          backgroundSize:
            "24px 24px",
        }}
      >
        <div className="flex gap-4">
          <div className="flex h-[250px] flex-col justify-between py-1 text-[13px] font-medium text-slate-600">
            <span>100%</span>
            <span>80%</span>
            <span>50%</span>
            <span>20%</span>
            <span>0</span>
          </div>

          <div className="min-w-0 flex-1 overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-[250px] w-full"
              preserveAspectRatio="none"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2={height}
                stroke="#111827"
                strokeWidth="3"
              />

              <line
                x1="0"
                y1={height}
                x2={width}
                y2={height}
                stroke="#111827"
                strokeWidth="3"
              />

              {[0, 20, 50, 80, 100].map(
                (mark) => (
                  <line
                    key={mark}
                    x1="0"
                    x2={width}
                    y1={
                      height -
                      (mark / 100) *
                        height
                    }
                    y2={
                      height -
                      (mark / 100) *
                        height
                    }
                    stroke="#E8EDF3"
                    strokeWidth="1"
                    strokeDasharray="4 7"
                  />
                )
              )}

              <polyline
                points={toPoints(
                  TARGET_LINE_DATA
                )}
                fill="none"
                stroke="#2CBF56"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={drawStyle(0)}
              />

              <polyline
                points={toPoints(
                  chartData
                )}
                fill="none"
                stroke="#8C1F1F"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={drawStyle(0.2)}
              />
            </svg>

            <div className="mt-2 flex justify-between text-[12px] font-medium text-slate-500">
              {CHART_LABELS.map(
                (label) => (
                  <span key={label}>
                    {label}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


const FamilyDashboard = () => {

  const [patient, setPatient] =
    useState(DEMO_PATIENT);

  const [dashboard, setDashboard] =
    useState(DEMO_DASHBOARD);

  const [isNotifOpen, setIsNotifOpen] =
    useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response =
          await getFamilyDashboard();

        console.log(
          "RESPONSE :",
          response
        );

        if (response?.data?.patient) {
          setPatient(
            response.data.patient
          );
        }

        if (response?.data?.dashboard) {
          setDashboard(
            response.data.dashboard
          );
        }
      } catch (err) {
        console.error(
          "Family dashboard API:",
          err
        );

      }
    };

    fetchDashboard();
  }, []);


  const handleSendReminder =
    async () => {
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
    <div
      className="min-h-screen w-full overflow-x-hidden bg-[#F6F7FB]"
      style={{
        fontFamily:
          "'Poppins', sans-serif",
      }}
    >
      <DashboardHeader
        isNotifOpen={
          isNotifOpen
        }
        onToggleNotif={() =>
          setIsNotifOpen(
            (prev) => !prev
          )
        }
      />

      <main className="px-8 pb-10 pt-7 lg:px-10">
  
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,500px)_240px_240px_minmax(300px,1fr)]">

          <ScheduleCard
            dashboard={dashboard}
            onSendReminder={
              handleSendReminder
            }
          />

          <TherapyProgressCard
            dashboard={dashboard}
          />

          <div className="flex flex-col gap-6">
            <ComplianceBadgeCard
              dashboard={dashboard}
            />

            <RemainingStockCard
              dashboard={dashboard}
            />
          </div>

          <div className="flex items-end">
            <WhatsappBanner />
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,500px)_240px_240px_minmax(300px,1fr)]">
          <div className="xl:col-start-2 xl:col-span-3">
            <ComplianceChartCard
              dashboard={dashboard}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default FamilyDashboard;