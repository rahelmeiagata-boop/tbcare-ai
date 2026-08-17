import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Check, Eye, EyeOff } from 'lucide-react';
import { register } from '../../services/authService';
import toast from 'react-hot-toast';

function GoogleIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 18 18" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.348 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 2.58z"
      />
    </svg>
  );
}

function TextField({ label, id, error, className = '', ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-slate-900 sm:text-base">
        {label}
      </label>
      <input
        id={id}
        className={`w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base ${className}`}
        {...inputProps}
      />
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}

function PasswordField({ label, id, error, visible, onToggleVisible, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-slate-900 sm:text-base">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base"
          {...inputProps}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
          className="absolute inset-y-0 right-0 flex items-center rounded-md pr-4 text-slate-400 transition hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:text-blue-500"
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}

const DUMMY_GOOGLE_ACCOUNTS = ['user1@gmail.com', 'user2@gmail.com'];

function GoogleAccountModal({ onSelect, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <GoogleIcon className="h-6 w-6" />
          <h2 id="google-modal-title" className="text-base font-bold text-slate-900">
            Pilih akun
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">untuk melanjutkan ke TBCare AI</p>

        <div className="mt-4 flex flex-col gap-1">
          {DUMMY_GOOGLE_ACCOUNTS.map((email) => (
            <button
              key={email}
              type="button"
              onClick={() => onSelect(email)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                {email.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm font-medium text-slate-900">{email}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  gender: '',
  role: 'patient',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if ((name === 'password' || name === 'confirmPassword') && passwordError) {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Password dan Konfirmasi Password tidak cocok.');
      return;
    }

    if (!formData.role) {
      toast.error('Silakan pilih peran Anda.');
      return;
    }

    if (!formData.gender) {
      toast.error('Silakan pilih jenis kelamin.');
      return;
    }

    try {
      const response = await register({
        nama: formData.name,
        email: formData.email,
        nomor_hp: formData.phone,
        jenis_kelamin: formData.gender,
        role: formData.role,
        password: formData.password,
        tanggal_lahir: null,
        alamat: null,
      });

      console.log('REGISTER BERHASIL:', response);

      toast.success('Akun berhasil dibuat. Silakan login.');

      navigate('/login');
    } catch (err) {
      console.error('REGISTER ERROR:', err);

      toast.error(
        err.response?.data?.message ||
        'Gagal membuat akun.'
      );
    }
  };

  const handleGoogleAccountSelect = (email) => {

    console.log('Akun Google dipilih (simulasi):', email);
    setIsGoogleModalOpen(false);
    navigate('/dashboard');
  };

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-10 antialiased sm:px-6"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="w-full max-w-3xl rounded-3xl border border-slate-100 bg-white p-8 shadow-xl sm:p-10 lg:p-12">
        <Link
          to="/"
          aria-label="Kembali ke Beranda"
          className="inline-flex rounded-full p-1 text-slate-900 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <X size={22} strokeWidth={2.5} />
        </Link>

        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-10">

          <div className="hidden shrink-0 lg:flex lg:w-56 lg:flex-col lg:justify-end">
            <img
              src="/assets/register-il.png"
              alt="Register Illustration"
              className="w-full object-contain"
            />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Buat Akun Baru
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              Daftar untuk memulai perjalanan terapi anda bersama TBCare AI
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
              <TextField
                label="Nama Lengkap"
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Masukkan Nama Lengkap"
                autoComplete="name"
              />

              <TextField
                label="Email"
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Masukkan Email"
                autoComplete="email"
              />

              <TextField
                label="Nomor Telepon"
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="08xxxxxxx"
                autoComplete="tel"
              />

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-900 sm:text-base">
                  Daftar sebagai
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        role: "patient",
                      }))
                    }
                    className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${formData.role === "patient"
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    Pasien
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        role: "family",
                      }))
                    }
                    className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${formData.role === "family"
                        ? "border-teal-500 bg-teal-50 text-teal-600"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    Pendamping
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="gender"
                  className="mb-2 block text-sm font-bold text-slate-900 sm:text-base"
                >
                  Jenis Kelamin
                </label>

                <select
                  id="gender"
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base"
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <PasswordField
                label="Password"
                id="password"
                name="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimal 8 Karakter"
                autoComplete="new-password"
                visible={showPassword}
                onToggleVisible={() => setShowPassword((prev) => !prev)}
              />

              <PasswordField
                label="Konfirmasi Password"
                id="confirmPassword"
                name="confirmPassword"
                required
                minLength={8}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Ulangi Password"
                autoComplete="new-password"
                visible={showConfirmPassword}
                onToggleVisible={() => setShowConfirmPassword((prev) => !prev)}
                error={passwordError}
              />

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  required
                  className="peer sr-only"
                />
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 ${agreedToTerms ? 'border-teal-500 bg-teal-500' : 'border-slate-300 bg-slate-100'
                    }`}
                >
                  {agreedToTerms && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </span>
                <span className="text-sm text-slate-900 sm:text-base">
                  Saya setuju dengan{' '}
                  <a
                    href="#syarat-ketentuan"
                    className="font-semibold text-teal-500 transition hover:text-teal-600"
                  >
                    Syarat &amp; Ketentuan
                  </a>{' '}
                  dan{' '}
                  <a
                    href="#kebijakan-privasi"
                    className="font-semibold text-teal-500 transition hover:text-teal-600"
                  >
                    Kebijakan Privasi
                  </a>
                </span>
              </label>

              <button
                type="submit"
                className="w-full rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:text-base"
              >
                Daftar Sekarang
              </button>

              <p className="text-center text-sm text-slate-500 sm:text-base">
                atau daftar dengan
              </p>

              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(true)}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:text-base"
              >
                <GoogleIcon className="h-5 w-5" />
                Daftar Dengan Google
              </button>
            </form>
          </div>
        </div>
      </div>

      {isGoogleModalOpen && (
        <GoogleAccountModal
          onSelect={handleGoogleAccountSelect}
          onClose={() => setIsGoogleModalOpen(false)}
        />
      )}
    </div>
  );
}