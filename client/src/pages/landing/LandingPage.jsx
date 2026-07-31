import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Plus } from 'lucide-react';

import phoneImg from '../../assets/phone.png';
import resepImg from '../../assets/resep-il.png';
import consultingImg from '../../assets/consulting-il.png';
import famImg from '../../assets/fam-il.png';

function MedicalCrossBadge({ size = 20, className = '' }) {
  return (
    <div
      className={`items-center justify-center rounded-full border-2 border-slate-800 bg-white ${className}`}
      style={{ width: size, height: size }}
    >
      <Plus size={Math.round(size * 0.5)} strokeWidth={2.5} className="text-teal-500" />
    </div>
  );
}

const NAV_LINKS = [
  { id: 'beranda', label: 'Beranda' },
  { id: 'fitur', label: 'Fitur' },
  { id: 'tentang', label: 'Tentang' },
  { id: 'kontak', label: 'Kontak' },
];

function Navbar({ activeSection, onSectionClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavClick = (id) => (e) => {
    e.preventDefault();
    onSectionClick(id);
    setIsMenuOpen(false);
  };

  return (
    <header className="relative z-20">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-12">
        <a
          href="#beranda"
          onClick={handleNavClick('beranda')}
          className="rounded-md text-lg font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          TBCare AI
        </a>

        <div className="hidden items-center gap-3 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={handleNavClick(link.id)}
                aria-current={isActive ? 'true' : undefined}
                className={
                  isActive
                    ? 'rounded-full border-b-4 border-teal-700 bg-teal-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2'
                    : 'rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
                }
              >
                {link.label}
              </a>
            );
          })}
        </div>

        <Link
          to="/login"
          className="hidden rounded-full bg-blue-500 px-7 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 md:inline-block"
        >
          Masuk
        </Link>

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Buka menu navigasi"
          aria-expanded={isMenuOpen}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2.5 text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 md:hidden"
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {isMenuOpen && (
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-6 py-5 md:hidden">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={handleNavClick(link.id)}
                className={
                  isActive
                    ? 'rounded-full bg-teal-500 px-5 py-2.5 text-center text-sm font-semibold text-white'
                    : 'rounded-full border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold text-slate-700'
                }
              >
                {link.label}
              </a>
            );
          })}
          <Link
            to="/login"
            onClick={() => setIsMenuOpen(false)}
            className="rounded-full bg-blue-500 px-5 py-2.5 text-center text-sm font-semibold text-white"
          >
            Masuk
          </Link>
        </div>
      )}
    </header>
  );
}

function HeroSection({ onStartClick, onLearnMoreClick }) {
  return (
    <section id="beranda" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-16 pt-4 lg:grid-cols-2 lg:gap-10 lg:px-12 lg:pb-24">
        {/* Kolom kiri — copy */}
        <div className="relative">
          <MedicalCrossBadge size={40} className="absolute -top-8 left-0 hidden lg:flex" />

          <h1 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
            Temani Setiap Langkah Menuju Kesembuhan
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600 sm:text-lg">
            TB Care AI membantu Anda menjalani terapi TBC dengan lebih tenang melalui
            pengingat obat, pendamping AI, dan dukungan keluarga.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={onStartClick}
              className="rounded-full bg-blue-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:text-base"
            >
              Mulai Sekarang
            </button>
            <button
              type="button"
              onClick={onLearnMoreClick}
              className="rounded-full border-2 border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-blue-500 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:text-base"
            >
              Pelajari Lebih Lanjut
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center py-4">
          <MedicalCrossBadge size={52} className="absolute right-2 top-0 hidden lg:flex" />
          <MedicalCrossBadge size={32} className="absolute right-16 top-14 hidden lg:flex" />
          <MedicalCrossBadge size={44} className="absolute left-0 top-1/3 hidden lg:flex" />
          <MedicalCrossBadge size={28} className="absolute left-10 top-1/2 hidden lg:flex" />

          <img
            src={phoneImg}
            alt="Ilustrasi 3D ponsel TBCare AI dengan shield, botol obat, dan notifikasi"
            className="aspect-square w-full max-w-md object-contain sm:max-w-lg"
          />
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    title: 'Scan Resep AI',
    description: 'AI membaca resep dan menambahkan obat secara otomatis',
    image: resepImg,
    href: '/features/scanner',
  },
  {
    title: 'AI Consulting',
    description: 'Tanya seputar TBC dan dapatkan jawabnya',
    image: consultingImg,
    href: '/features/chat',
  },
  {
    title: 'Family Monitoring',
    description: 'Keluarga dapat memantau progres minum obat secara real-time',
    image: '/assets/feature-family-monitoring.png',
    href: '/features/monitoring',
  },
];

function FeatureCard({ title, description, image, href }) {
  return (
    <Link
      to={href}
      className="flex flex-col items-center rounded-3xl border border-slate-100 bg-slate-50 p-8 text-center transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:p-10"
    >
      <img src={image} alt={title} className="mb-6 h-40 w-40 object-contain" />
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{description}</p>
    </Link>
  );
}

function FeaturesSection() {
  return (
    <section id="fitur" className="bg-white py-16 lg:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 md:grid-cols-3 lg:gap-8 lg:px-12">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="tentang" className="bg-slate-50 py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-6 text-center lg:px-12">
        <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">TBCare AI</h2>
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
          TBCare AI adalah platform pendamping digital berbasis kecerdasan buatan (Artificial Intelligence)
          yang dirancang untuk membantu pasien Tuberkulosis (TBC) menjalani pengobatan secara lebih mudah, teratur, dan terpantau.
          Aplikasi ini hadir sebagai solusi untuk meningkatkan kepatuhan pasien dalam mengonsumsi obat sekaligus memberikan
          akses informasi kesehatan yang cepat dan mudah dipahami.
        </p>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="kontak" className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-6 text-center lg:px-12">
        <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Kontak</h2>
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
          Hubungi kontak berikut:
        </p>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState('beranda');
  const navigate = useNavigate();

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleStartClick = () => {

    const isLoggedIn = Boolean(localStorage.getItem('registeredUser'));
    navigate(isLoggedIn ? '/dashboard' : '/login');
  };

  return (
    <div
      className="min-h-screen w-full bg-slate-50 antialiased"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <Navbar activeSection={activeSection} onSectionClick={scrollToSection} />
      <HeroSection onStartClick={handleStartClick} onLearnMoreClick={() => scrollToSection('fitur')} />
      <FeaturesSection />
      <AboutSection />
      <ContactSection />
    </div>
  );
}