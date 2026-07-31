import { useState, useMemo } from 'react';
import {Home, PlusCircle, Camera, Users, MessageSquare, Settings, BellPlus, ChevronRight, HeartPulse, QrCode, FileEdit, Bot, Award, Pill,
} from 'lucide-react';

const WhatsAppIcon = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="currentColor" className={className}>
    <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.362.685 4.564 1.868 6.42L4 29l7.77-1.836A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.818a9.78 9.78 0 0 1-4.99-1.363l-.358-.213-4.61 1.09 1.113-4.49-.234-.367A9.78 9.78 0 0 1 5.2 15c0-5.965 4.848-10.818 10.804-10.818S26.808 9.035 26.808 15 21.964 24.818 16.004 24.818Zm5.63-8.144c-.308-.154-1.822-.9-2.104-1.003-.282-.103-.487-.154-.692.154-.205.308-.795 1.003-.975 1.209-.18.205-.36.231-.667.077-.308-.154-1.3-.479-2.475-1.527-.915-.816-1.533-1.824-1.713-2.132-.18-.308-.02-.475.135-.628.138-.138.308-.36.462-.54.154-.18.205-.308.308-.513.103-.205.051-.385-.026-.539-.077-.154-.692-1.669-.949-2.286-.25-.6-.504-.519-.692-.529-.18-.009-.385-.011-.59-.011-.205 0-.539.077-.821.385-.282.308-1.077 1.052-1.077 2.567 0 1.515 1.103 2.978 1.257 3.183.154.205 2.17 3.313 5.257 4.646.735.317 1.308.507 1.755.649.737.234 1.408.201 1.938.122.591-.088 1.822-.744 2.078-1.463.257-.719.257-1.335.18-1.463-.077-.128-.282-.205-.59-.36Z" />
  </svg>
);

const CircularProgress = ({ percentage }) => {
  const size = 168;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#5eead4" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E7EBF3" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-3xl font-extrabold text-gray-900">{percentage}%</span>
    </div>
  );
};

const TOTAL_HARI_PROGRAM = 180;

const MENU_ITEMS = [
  { id: 'Dasboard', label: 'Dasboard', icon: Home },
  { id: 'Obat Saya', label: 'Obat Saya', icon: PlusCircle },
  { id: 'Scanning Resep AI', label: 'Scanning Resep AI', icon: Camera },
  { id: 'Family Monitoring', label: 'Family Monitoring', icon: Users },
  { id: 'AI Chat Doctor', label: 'AI Chat Doctor', icon: MessageSquare },
  { id: 'Pengaturan', label: 'Pengaturan', icon: Settings },
];

const HEADER_CONTENT = {
  Dasboard: {
    title: 'HALO, PENGGUNA!',
    subtitle: 'Tetap Semangat! Konsistensi minum obat kunci kesembuhan',
  },
  'Obat Saya': {
    title: 'OBAT SAYA',
    subtitle: 'Kelola daftar dan dosis obat harian Anda',
  },
  'Scanning Resep AI': {
    title: 'SCANNING RESEP AI',
    subtitle: 'Pindai resep dokter untuk deteksi obat otomatis',
  },
  'Family Monitoring': {
    title: 'FAMILY MONITORING',
    subtitle: 'Pantau kepatuhan minum obat anggota keluarga',
  },
  'AI Chat Doctor': {
    title: 'AI CHAT DOCTOR',
    subtitle: 'Konsultasi seputar terapi bersama asisten AI',
  },
  Pengaturan: {
    title: 'PENGATURAN',
    subtitle: 'Kelola preferensi akun dan aplikasi Anda',
  },
};

const QUICK_ACTIONS = [
  { label: 'Scan Resep AI', icon: QrCode, bg: 'bg-blue-600', tab: 'Scanning Resep AI' },
  { label: 'Tambah Obat Manual', icon: FileEdit, bg: 'bg-teal-400', tab: 'Obat Saya' },
  { label: 'Chat AI Doctor', icon: Bot, bg: 'bg-blue-600', tab: 'AI Chat Doctor' },
  { label: 'Monitoring keluarga', icon: Users, bg: 'bg-teal-400', tab: 'Family Monitoring' },
];

export default function DashboardPage() {

  const [activeTab, setActiveTab] = useState('Dasboard');
  const [sisaObat, setSisaObat] = useState(14);
  const [jumlahHariKepatuhan, setJumlahHariKepatuhan] = useState(153);
  const [jadwalHariIni, setJadwalHariIni] = useState([
    { id: 1, waktu: '08:00', namaObat: 'Rifampisin 600 Mg', status: 'Sudah Minum' },
    { id: 2, waktu: '08:00', namaObat: 'Pirazinamid 500 Mg', status: 'Belum Minum' },
  ]);

  const progresPersentase = useMemo(
    () => Math.min(100, Math.round((jumlahHariKepatuhan / TOTAL_HARI_PROGRAM) * 100)),
    [jumlahHariKepatuhan]
  );

  const handleMinumObat = (id) => {
    const target = jadwalHariIni.find((item) => item.id === id);
    if (!target || target.status !== 'Belum Minum') return;

    setJadwalHariIni((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Sudah Minum' } : item))
    );
    setSisaObat((prev) => Math.max(0, prev - 1));
    setJumlahHariKepatuhan((prev) => prev + 1);
  };

  const currentHeader = HEADER_CONTENT[activeTab];
  const ActiveIcon = MENU_ITEMS.find((m) => m.id === activeTab)?.icon;

  return (
    <div className="min-h-screen w-full flex bg-slate-100" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>

      <aside className="relative w-72 shrink-0 overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 px-5 py-8 flex flex-col">
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -left-16 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center ring-1 ring-white/20">
            <HeartPulse className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white text-xl font-bold tracking-wide">TBCare</span>
        </div>

        <nav className="relative flex flex-col gap-3">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 ${
                  isActive ? 'bg-blue-400 shadow-lg' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-10 py-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{currentHeader.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{currentHeader.subtitle}</p>
          </div>
          <div className="flex items-center gap-5">
            <button className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow">
              <BellPlus className="w-5 h-5 text-gray-800" strokeWidth={2} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300" />
              <span className="font-semibold text-gray-800 text-sm">Username</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-10 pb-10">
          {activeTab === 'Dasboard' ? (
            <>

              <div className="grid grid-cols-12 gap-6">

                <div className="col-span-12 lg:col-span-7 bg-white rounded-3xl shadow-sm p-7 flex flex-col">
                  <h2 className="text-xl font-bold text-gray-900">Jadwal Hari Ini</h2>
                  <p className="text-gray-400 text-sm mt-1 mb-5">Sabtu, 18 Juli 2026</p>

                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    {jadwalHariIni.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`flex items-stretch text-sm ${
                          idx !== jadwalHariIni.length - 1 ? 'border-b border-gray-200' : ''
                        }`}
                      >
                        <div className="w-20 shrink-0 px-4 py-3.5 border-r border-gray-200 text-gray-700 font-medium flex items-center">
                          {item.waktu}
                        </div>
                        <div className="flex-1 px-4 py-3.5 border-r border-gray-200 text-gray-700 font-medium flex items-center">
                          {item.namaObat}
                        </div>
                        <div className="w-36 shrink-0 px-4 py-3.5 flex items-center justify-center">
                          {item.status === 'Belum Minum' ? (
                            <button
                              onClick={() => handleMinumObat(item.id)}
                              className="text-red-500 font-semibold hover:text-red-600 hover:underline transition-colors"
                            >
                              Belum Minum
                            </button>
                          ) : (
                            <span className="text-blue-600 font-semibold">Sudah Minum</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 flex items-end mt-6">
                    <button className="group w-full bg-gradient-to-r from-teal-600 to-teal-400 text-white font-semibold py-3.5 rounded-full shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-1">
                      Lihat Jadwa Selengkapnya
                      <ChevronRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </button>
                  </div>
                </div>

                <div className="col-span-6 lg:col-span-2 bg-white rounded-3xl shadow-sm p-6 flex flex-col items-center">
                  <h2 className="text-base font-bold text-gray-900 self-start mb-4">Progres Terapi</h2>
                  <div className="flex-1 flex items-center justify-center">
                    <CircularProgress percentage={progresPersentase} />
                  </div>
                  <p className="text-gray-800 font-semibold mt-4 text-sm text-center">
                    {jumlahHariKepatuhan}/{TOTAL_HARI_PROGRAM} Hari
                  </p>
                </div>


                <div className="col-span-6 lg:col-span-3 flex flex-col gap-6">
                  <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col items-center flex-1">
                    <h2 className="text-base font-bold text-gray-900 self-start mb-3">Badge Kepatuhan</h2>
                    <Award className="w-16 h-16 text-blue-600" strokeWidth={1.5} />
                    <p className="text-2xl font-extrabold text-gray-900 mt-3">
                      {jumlahHariKepatuhan} <span className="text-base font-bold">Hari</span>
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">Berturut-turut</p>
                  </div>

                  <div className="bg-white rounded-3xl shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-900 mb-2">Sisa Obat</h2>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-800">{sisaObat} Tablet</span>
                      <Pill className="w-9 h-9 text-cyan-400 rotate-45" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-6 mt-6">

                <div className="col-span-12 lg:col-span-8 bg-slate-50 rounded-3xl shadow-sm p-7">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Action</h2>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    {QUICK_ACTIONS.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.label}
                          onClick={() => setActiveTab(action.tab)}
                          className="group flex items-center gap-3.5 text-left"
                        >
                          <div
                            className={`w-14 h-14 rounded-2xl ${action.bg} flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105`}
                          >
                            <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                          </div>
                          <span className="font-bold text-gray-900 text-sm leading-snug">{action.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-4 flex items-end">
                  <div className="w-full bg-white rounded-3xl shadow-sm p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                      <WhatsAppIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Notifikasi Aktif</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        Notifikasi akan dikirim melalui WhatsApp sesuai jadwal anda
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-24">
              <div className="bg-white rounded-3xl shadow-sm p-14 flex flex-col items-center text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
                  {ActiveIcon && <ActiveIcon className="w-8 h-8 text-blue-600" strokeWidth={2} />}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Halaman {activeTab}</h3>
                <p className="text-gray-400 text-sm">Fitur ini sedang dalam tahap pengembangan.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}