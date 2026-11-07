import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  Flame,
  Info,
  Package,
  Pill,
  TrendingUp,
} from "lucide-react";
import {
  getFamilyDashboard,
  searchFamily,
  addFamily,
} from "../../services/familyService";
import { sendReminder } from "../../services/notificationService";
import { toast } from "react-toastify";


const TOTAL_THERAPY_DAYS = 180;
function IconBox({ children, color = "mint" }) {
  const colors = {
    mint: "bg-[#E7F8F4] text-[#008F83]",
    amber: "bg-[#FFF5DF] text-[#D97706]",
    rose: "bg-[#FFE9EA] text-[#E04455]",
    green: "bg-[#E7F8ED] text-[#178653]",
  };

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${colors[color]}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <IconBox>{icon}</IconBox>
      <div className="min-w-0">
        <h2 className="font-bold text-[#14233F]">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <section
      className={`min-w-0 rounded-3xl border border-[#E6EFEE] bg-white p-5 shadow-[0_5px_20px_rgba(25,70,75,0.045)] sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

function TherapyProgressCard({ dashboard }) {
  const progress = Math.max(
    0,
    Math.min(100, Number(dashboard?.therapy_progress ?? 0))
  );

  const completed = Math.max(
    0,
    Number(dashboard?.therapy_day ?? 0)
  );

  const remaining = Math.max(0, TOTAL_THERAPY_DAYS - completed);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <Card className="flex flex-col">
      <SectionTitle
        icon={<ChartNoAxesColumnIncreasing size={22} />}
        title="Progres Terapi Pasien"
        subtitle="Perjalanan pengobatan pasien"
      />

      <div className="flex flex-1 flex-col items-center justify-center py-4">
        <div className="relative h-44 w-44">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
            <circle
              cx="70"
              cy="70"
              r="54"
              stroke="#E5EBF2"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="70"
              cy="70"
              r="54"
              stroke="#0D9B8E"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              fill="none"
              className="transition-all duration-700"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-[#14233F]">
              {progress}%
            </span>
            <span className="mt-1 text-xs text-slate-500">progres</span>
          </div>
        </div>

        <p className="mt-3 text-xl font-bold text-[#14233F]">
          {completed}/{TOTAL_THERAPY_DAYS} Hari
        </p>
        <p className="mt-2 text-center text-sm leading-6 text-slate-500">
          Progres pengobatan berdasarkan data yang tersedia.
        </p>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#EDF9F6] p-4">
        <IconBox>
          <CalendarDays size={21} />
        </IconBox>
        <div>
          <p className="text-sm font-bold text-[#176D65]">
            {remaining} hari tersisa
          </p>
          <p className="mt-1 text-xs text-slate-500">
            dari total {TOTAL_THERAPY_DAYS} hari terapi.
          </p>
        </div>
      </div>
    </Card>
  );
}

function MedicationScheduleCard({
  schedule,
  onReminder,
  onViewAll,
  reminderCooldowns,
}) {
  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          icon={<CalendarDays size={22} />}
          title="Jadwal Konsumsi Obat"
          subtitle="Pantau jadwal obat pasien"
        />

        <span className="rounded-full bg-[#EDF9F6] px-3 py-1.5 text-xs font-semibold text-[#008F83]">
          {schedule.length} jadwal
        </span>
      </div>

      {schedule.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-[#E8EFEE]">
          <div className="grid grid-cols-[68px_minmax(0,1fr)_auto] gap-2 bg-[#F4F8FA] px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:grid-cols-[85px_minmax(0,1fr)_auto] sm:px-4">
            <span>Waktu</span>
            <span>Nama obat</span>
            <span>Aksi</span>
          </div>

          <div className="divide-y divide-[#EDF1F5]">
            {schedule.slice(0, 5).map((item, index) => {
              const itemId = item.id ?? `${item.name}-${item.time}`;
              const isSent =
                Date.now() < (reminderCooldowns?.[itemId] ?? 0);

              return (
                <div
                  key={`${item.name}-${item.time}-${index}`}
                  className="grid grid-cols-[68px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-3.5 sm:grid-cols-[85px_minmax(0,1fr)_auto] sm:px-4"
                >
                  <span className="text-xs font-medium text-slate-600 sm:text-sm">
                    {item.time}
                  </span>

                  <span className="truncate text-sm font-semibold capitalize text-[#24334D]">
                    {item.name}
                  </span>

                  {item.status === "taken" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#E7F8ED] px-2.5 py-2 text-xs font-bold text-[#178653] sm:px-3">
                      <CheckCircle2 size={14} />
                      <span>Sudah Diminum</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isSent}
                      onClick={() => onReminder(item)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition sm:px-3 ${isSent
                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                        : "bg-[#FFE9EA] text-[#D83F50] hover:bg-[#FFD9DC]"
                        }`}
                    >
                      {isSent ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Bell size={14} />
                      )}

                      <span>{isSent ? "Terkirim" : "Ingatkan"}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {schedule.length > 5 && (
            <button
              type="button"
              onClick={onViewAll}
              className="mt-3 w-full rounded-xl border border-[#DDEFEA] py-3 text-sm font-bold text-[#008F83] transition hover:bg-[#EDF9F6]"
            >
              Lihat Jadwal Selengkapnya
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center">
          <Pill className="mx-auto mb-3 text-slate-400" size={30} />
          <p className="font-semibold text-slate-700">
            Belum ada jadwal obat
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Jadwal akan muncul ketika data tersedia.
          </p>
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>
          Bantu pasien mengikuti jadwal pengobatan sesuai arahan tenaga
          kesehatan.
        </p>
      </div>
    </Card>
  );
}
function SummaryCard({ icon, title, value, unit, description, color }) {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-5 text-slate-500">
            {title}
          </p>
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-[#14233F]">
              {value}
            </span>
            {unit && (
              <span className="text-sm text-slate-500">{unit}</span>
            )}
          </div>
        </div>
        <IconBox color={color}>{icon}</IconBox>
      </div>
      {description && (
        <p className="mt-3 text-xs leading-5 text-slate-500">
          {description}
        </p>
      )}
    </Card>
  );
}
function ComplianceChartCard({ chartData }) {
  const width = 600;
  const height = 220;
  const left = 42;
  const right = 12;
  const top = 12;
  const bottom = 34;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const points = chartData.map((item, index) => ({
    ...item,
    x: left + (index / Math.max(1, chartData.length - 1)) * plotWidth,
    patientY: top + plotHeight - (item.patient / 100) * plotHeight,
    targetY: top + plotHeight - (item.target / 100) * plotHeight,
  }));
  const makeLine = (key) =>
    points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"} ${point.x} ${point[key]}`
      )
      .join(" ");

  const patientLine = makeLine("patientY");
  const targetLine = makeLine("targetY");
  const patientArea = `${patientLine} L ${points[points.length - 1]?.x ?? left} ${top + plotHeight} L ${left} ${top + plotHeight} Z`;
  return (
    <Card className="lg:col-span-3">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          icon={<ChartNoAxesColumnIncreasing size={22} />}
          title="Diagram Kepatuhan Pasien"
          subtitle="Perbandingan progres harian dengan target."
        />

        <div className="flex gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            Data pasien
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />
            Target
          </span>
        </div>
      </div>
      <div className="w-full overflow-hidden">
        {chartData.length > 0 ? (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full"
            style={{
              maxWidth: "1100px",
              maxHeight: "320px",
              margin: "0 auto",
              display: "block",
            }}
            role="img"
            aria-label="Diagram perbandingan progres pasien dengan target"
          >
            {[0, 25, 50, 75, 100].map((value) => {
              const y = top + plotHeight - (value / 100) * plotHeight;

              return (
                <g key={value}>
                  <line
                    x1={left}
                    y1={y}
                    x2={width - right}
                    y2={y}
                    stroke="#E8EEF2"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#94A3B8"
                  >
                    {value}%
                  </text>
                </g>
              );
            })}

            <path
              d={patientArea}
              fill="#F43F5E"
              opacity="0.08"
            />

            <path
              d={targetLine}
              fill="none"
              stroke="#0D9B8E"
              strokeWidth="3"
              strokeDasharray="6 5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d={patientLine}
              fill="none"
              stroke="#F43F5E"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((point, index) => (
              <g key={`${point.date}-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.patientY}
                  r="4"
                  fill="#F43F5E"
                  stroke="white"
                  strokeWidth="2"
                />
                <circle
                  cx={point.x}
                  cy={point.targetY}
                  r="3"
                  fill="#0D9B8E"
                  stroke="white"
                  strokeWidth="1.5"
                />
                <text
                  x={point.x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64748B"
                >
                  {point.date}
                </text>
              </g>
            ))}
          </svg>
        ) : (
          <div className="py-12 text-center text-sm text-slate-400">
            Belum ada data konsumsi obat.
          </div>
        )}
      </div>
      <p className="mt-1 text-center text-xs text-slate-400">
        7 hari terakhir · Persentase obat yang diminum
      </p>
    </Card>
  );
}
export default function FamilyDashboard() {
  const companion = JSON.parse(localStorage.getItem("user") || "{}");

  const [patient, setPatient] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [reminderCooldowns, setReminderCooldowns] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [searchPatient, setSearchPatient] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showConnectConfirm, setShowConnectConfirm] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Letakkan useEffect ini di sini
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredSchedule = schedule.filter((item) => {
    const cocokNama = item.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const cocokStatus =
      filterStatus === "Semua" ||
      (filterStatus === "taken" && item.status === "taken") ||
      (filterStatus === "pending" && item.status !== "taken");

    return cocokNama && cocokStatus;
  });
  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const response = await getFamilyDashboard();
        const result = response?.data ?? {};
        if (!active) return;

        setPatient(result.patient ?? null);
        setDashboard(result.dashboard ?? null);

        const schedules =
          result.dashboard?.today_schedule ?? [];
        setSchedule(
          Array.isArray(schedules)
            ? schedules.map((item) => ({
              ...item,
              name:
                item.med_name ??
                item.name ??
                item.medication_name ??
                item.medicine_name ??
                item.nama_obat ??
                "Obat",
              time:
                item.scheduled_time ??
                item.time ??
                item.schedule_time ??
                item.medication_time ??
                item.waktu ??
                "--:--",
            }))
            : []
        );
      } catch (error) {
        console.error("Gagal memuat Family Dashboard:", error);
        if (active) {
          toast.error("Data pemantauan gagal dimuat.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const handleSearchPatient = async () => {
    if (!searchPatient.trim()) {
      toast.info("Masukkan nama atau username pasien.");
      return;
    }

    try {
      setSearchLoading(true);
      setSelectedPatient(null);

      const response = await searchFamily(searchPatient);
      const result = response?.data;

      setSearchResults(
        Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : []
      );
    } catch (error) {
      console.error("Pencarian pasien gagal:", error);
      toast.error("Pencarian pasien gagal.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleConnectPatient = async () => {
    if (!selectedPatient?.id) return;

    try {
      setConnecting(true);

      await addFamily(selectedPatient.id);

      toast.success("Akun pasien berhasil dihubungkan.");
      setShowConnectConfirm(false);

      window.location.reload();
    } catch (error) {
      console.error("Gagal menghubungkan pasien:", error);
      toast.error(
        error.response?.data?.message ||
        "Akun pasien gagal dihubungkan."
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleReminder = async (item) => {
    if (!patient?.id) {
      toast.error("Data pasien belum tersedia.");
      return;
    }

    const itemId = item.id ?? `${item.name}-${item.time}`;
    const cooldownUntil = reminderCooldowns[itemId] ?? 0;

    if (item.status === "taken") {
      toast.info("Obat sudah diminum.");
      return;
    }

    if (Date.now() < cooldownUntil) {
      return;
    }

    try {
      console.log("Mengirim pengingat:", {
        patientId: patient.id,
        medication: item.name,
      });

      const response = await sendReminder(
        patient.id,
        `Pengingat minum obat: ${item.name}. Segera minum obat sesuai jadwal, ya.`
      );

      console.log("Respons pengingat:", response);

      setReminderCooldowns((prev) => ({
        ...prev,
        [itemId]: Date.now() + 5 * 60 * 1000,
      }));

      toast.success("Pengingat berhasil dikirim ke pasien.");
    } catch (error) {
      console.error("Gagal mengirim pengingat:", error.response?.data || error);
      toast.error(
        error.response?.data?.message || "Pengingat gagal dikirim."
      );
    }
  };
  const completed = Math.max(0, Number(dashboard?.therapy_day ?? 0));

  const streak = Math.max(
    0,
    Number(dashboard?.streak ?? dashboard?.streak_days ?? dashboard?.current_streak ?? 0)
  );

  const stock = Math.max(
    0,
    Number(dashboard?.total_stock ?? dashboard?.remaining_stock ?? dashboard?.stock_remaining ?? 0)
  );

  const chartData = (dashboard?.daily_history ?? []).map((item) => {
    const totalSchedule = Number(item.total_schedule ?? 0);
    const totalTaken = Number(item.total_taken ?? 0);

    return {
      date: new Date(item.day).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      }),
      patient:
        totalSchedule === 0
          ? 0
          : Math.round((totalTaken / totalSchedule) * 100),
      target: 100,
    };
  });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F3F8FA]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#D5EEEA] border-t-[#078F83]" />
          <p className="mt-4 text-sm text-slate-500">
            Memuat data pemantauan pasien...
          </p>
        </div>
      </div>
    );
  }
  return (
    <main className="min-h-screen bg-[#F3F8FA] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#008F83]">
              TBCARE · FAMILY MONITORING
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#14233F] sm:text-3xl">
              Selamat Datang, Pendamping! 👋
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Pantau perjalanan pengobatan dan dukung pasien setiap hari.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[#E5EFED] bg-white px-4 py-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DDF5F0] font-bold text-[#007F73]">
              {(companion?.nama ?? "P").charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="text-sm font-bold text-[#14233F]">
                {companion?.nama ?? "Pendamping"}
              </p>
              <p className="text-xs text-slate-500">
                {companion?.email ?? "-"}
              </p>
            </div>
          </div>
        </header>
        <div className="mb-5 rounded-3xl border border-[#DDEFEA] bg-gradient-to-r from-[#DDF7F0] via-[#EFFAF7] to-[#F9FCF8] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-2xl">
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-[#087D72]">
                RINGKASAN PEMANTAUAN
              </span>
              <h2 className="mt-3 text-xl font-extrabold text-[#14233F] sm:text-2xl">
                Setiap langkah berarti.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Dukungan dan perhatian keluarga membantu pasien tetap
                konsisten menjalani terapi.
              </p>
            </div>

            <div className="hidden h-20 w-20 items-center justify-center rounded-full bg-white/80 text-[#0D9B8E] sm:flex">
              <CheckCircle2 size={42} strokeWidth={1.5} />
            </div>
          </div>
        </div>
        <Card className="mb-5">
          <SectionTitle
            icon={<Info size={22} />}
            title="Hubungkan Akun Pasien"
            subtitle="Cari akun pasien menggunakan nama lengkap atau username."
          />
          {patient && (
            <div className="mb-5 rounded-2xl border border-[#BDE9D9] bg-[#EDF9F6] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#087D72]">
                    Pasien Terhubung
                  </p>
                  <p className="mt-1 font-bold text-[#14233F]">
                    {patient.nama}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {patient.email}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-[#D5F3E6] px-3 py-2 text-xs font-bold text-[#087D72]">
                  Sudah Terhubung
                </span>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={searchPatient}
              onChange={(e) => setSearchPatient(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchPatient();
              }}
              placeholder="Masukkan nama atau username pasien..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#008F83]"
            />

            <button
              type="button"
              onClick={handleSearchPatient}
              disabled={searchLoading}
              className="rounded-xl bg-[#008F83] px-6 py-3 text-sm font-bold text-white hover:bg-[#087D72] disabled:opacity-50"
            >
              {searchLoading ? "Mencari..." : "Cari Pasien"}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-bold text-[#14233F]">
                Hasil Pencarian
              </p>

              {searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedPatient(item)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${selectedPatient?.id === item.id
                    ? "border-[#008F83] bg-[#EDF9F6]"
                    : "border-slate-200 hover:border-[#008F83]"
                    }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#14233F]">
                        {item.nama}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        @{item.username}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.email}
                      </p>
                    </div>

                    {Number(item.is_connected) === 1 ? (
                      <span className="shrink-0 rounded-full bg-[#D5F3E6] px-3 py-2 text-xs font-bold text-[#087D72]">
                        Sudah Terhubung
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                        Belum Terhubung
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchResults.length === 0 &&
            searchPatient.trim() &&
            !searchLoading && (
              <p className="mt-4 text-sm text-slate-500">
                Belum ada hasil pencarian. Silakan cari akun pasien.
              </p>
            )}

          {selectedPatient && (
            <div className="mt-5 rounded-2xl border border-[#DDEFEA] bg-[#F4FAF8] p-5">
              <p className="text-sm font-bold text-[#087D72]">
                Detail Akun Pasien
              </p>

              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>Nama: {selectedPatient.nama}</p>
                <p>Username: {selectedPatient.username}</p>
                <p>Email: {selectedPatient.email}</p>
                <p>Tipe akun: {selectedPatient.role}</p>
              </div>

              <button
                type="button"
                disabled={Number(selectedPatient.is_connected) === 1}
                onClick={() => setShowConnectConfirm(true)}
                className="mt-5 w-full rounded-xl bg-[#008F83] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#087D72] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {Number(selectedPatient.is_connected) === 1
                  ? "Akun Sudah Terhubung"
                  : "Hubungkan Akun"}
              </button>
            </div>
          )}
        </Card>
        <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <MedicationScheduleCard
              schedule={schedule}
              onReminder={handleReminder}
              onViewAll={() => setShowScheduleModal(true)}
              reminderCooldowns={reminderCooldowns}
            />
          </div>

          <div className="xl:col-span-3">
            <TherapyProgressCard dashboard={dashboard} />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:col-span-2 xl:grid-cols-1">
            <SummaryCard
              icon={<Flame size={22} />}
              title="Konsistensi Pengobatan"
              value={streak}
              unit="hari berturut-turut"
              description="Pantau konsistensi pasien setiap hari."
              color="amber"
            />
            <SummaryCard
              icon={<Package size={22} />}
              title="Sisa Persediaan Obat"
              value={stock}
              unit="tablet"
              description="Periksa persediaan secara berkala dan hubungi tenaga kesehatan bila diperlukan."
              color="green"
            />
          </div>

          <div className="xl:col-span-2">
            <Card className="h-full bg-gradient-to-br from-[#E7F8F3] to-white">
              <IconBox color="amber">
                <TrendingUp size={22} />
              </IconBox>

              <h2 className="mt-4 font-bold text-[#14233F]">
                Insight Hari Ini
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Pantau jadwal dan perkembangan pasien secara berkala.
                Berikan dukungan agar pengobatan tetap berjalan sesuai
                arahan tenaga kesehatan.
              </p>

              <div className="mt-5 rounded-2xl bg-white/80 p-4">
                <p className="text-xs text-slate-500">
                  Hari terapi tercatat
                </p>
                <p className="mt-1 text-2xl font-extrabold text-[#087D72]">
                  {completed} hari
                </p>
              </div>
            </Card>
          </div>

          <div className="xl:col-span-12">
            <ComplianceChartCard chartData={chartData} />
          </div>

        </div>
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:p-7">

              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#14233F]">
                    Semua Jadwal Obat
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Pantau seluruh jadwal konsumsi obat pasien.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
                >
                  Tutup
                </button>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama obat..."
                className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#008F83]"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { label: "Semua", value: "Semua" },
                  { label: "Sudah Diminum", value: "taken" },
                  { label: "Belum Diminum", value: "pending" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilterStatus(option.value)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition ${filterStatus === option.value
                      ? "bg-[#008F83] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-100">
                {filteredSchedule.length > 0 ? (
                  filteredSchedule.map((item, index) => (
                    <div
                      key={`${item.name}-${item.time}-${index}`}
                      className="flex flex-wrap items-center justify-between gap-3 p-4"
                    >
                      <div>
                        <p className="text-sm font-bold text-[#24334D]">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Jadwal: {item.time}
                        </p>
                      </div>

                      {item.status === "taken" ? (
                        <span className="rounded-xl bg-[#E7F8ED] px-3 py-2 text-xs font-bold text-[#178653]">
                          Sudah Diminum
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={
                            item.status === "taken" ||
                            (reminderCooldowns[item.id] &&
                              currentTime < reminderCooldowns[item.id])
                          }
                          onClick={() => handleReminder(item)}
                          className="rounded-xl bg-[#FFE9EA] px-3 py-2 text-xs font-bold text-[#D83F50] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {item.status === "taken"
                            ? "Sudah Diminum"
                            : reminderCooldowns[item.id] &&
                              currentTime < reminderCooldowns[item.id]
                              ? `Tunggu ${Math.ceil(
                                (reminderCooldowns[item.id] - currentTime) / 1000
                              )} detik`
                              : "Ingatkan"}
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="p-8 text-center text-sm text-slate-500">
                    Jadwal obat tidak ditemukan.
                  </p>
                )}
              </div>

            </div>
          </div>
        )}

        {showConnectConfirm && selectedPatient && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <h2 className="text-lg font-bold text-[#14233F]">
                Konfirmasi Penghubungan
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Apakah kamu yakin ingin menghubungkan akun pasien{" "}
                <strong>{selectedPatient.nama}</strong>?
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={connecting}
                  onClick={() => setShowConnectConfirm(false)}
                  className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={connecting}
                  onClick={handleConnectPatient}
                  className="flex-1 rounded-xl bg-[#008F83] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {connecting ? "Menghubungkan..." : "Ya, Hubungkan"}
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="py-7 text-center text-xs text-slate-400">
          TBcare · Mendampingi perjalanan pengobatan dengan kepedulian.
        </footer>
      </div>
    </main>
  );
}