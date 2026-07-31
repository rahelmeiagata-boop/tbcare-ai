import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Check } from 'lucide-react';
import registerIllustration from '../../assets/register-il.png';

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
 
const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};
 
export default function RegisterPage() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordError, setPasswordError] = useState('');
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
 
    if ((name === 'password' || name === 'confirmPassword') && passwordError) {
      setPasswordError('');
    }
  };
 
  const handleSubmit = (e) => {
    e.preventDefault();
 
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Password dan Konfirmasi Password tidak cocok.');
      return;
    }
 
    const { name, email, phone, password } = formData;
    localStorage.setItem('registeredUser', JSON.stringify({ name, email, phone, password }));
 
    alert('Registrasi Berhasil!');
 
    setFormData(INITIAL_FORM);
    setAgreedToTerms(false);
    setPasswordError('');
  };
 
  const handleGoogleSignIn = () => {
    // TODO: sambungkan ke flow OAuth Google Anda
    console.log('Daftar dengan Google diklik');
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
              src={registerIllustration}
              alt="Ilustrasi pengguna TBCare AI"
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
 
              <TextField
                label="Password"
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimal 8 Karakter"
                autoComplete="new-password"
              />
 
              <TextField
                label="Konfirmasi Password"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Ulangi Password"
                autoComplete="new-password"
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
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 ${
                    agreedToTerms ? 'border-teal-500 bg-teal-500' : 'border-slate-300 bg-white'
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
                onClick={handleGoogleSignIn}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:text-base"
              >
                <GoogleIcon className="h-5 w-5" />
                Daftar Dengan Google
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
 
