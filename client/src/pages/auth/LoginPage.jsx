import { useState } from 'react';
import { X, Eye, EyeOff, Users } from 'lucide-react';

function PersonIllustrationPlaceholder({ className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-slate-300 bg-slate-100 text-center ${className}`}
    >
      <Users className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
      <span className="text-xs font-medium text-slate-400">Foto</span>
    </div>
  );
}

export default function LoginPage({ onClose }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: sambungkan ke logic autentikasi / API Anda
    console.log('Login submitted:', formData);
  };

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-10 antialiased sm:px-6"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="w-full max-w-xl rounded-3xl border border-slate-100 bg-white p-8 shadow-xl sm:p-10">

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="rounded-full p-1 text-slate-900 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <X size={22} strokeWidth={2.5} />
        </button>

        <div className="mt-6">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Selamat Datang Kembali!
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Masuk untuk melanjutkan pengalaman terapi anda
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col items-center gap-6 sm:flex-row"
        >
          <PersonIllustrationPlaceholder className="h-36 w-36 shrink-0 sm:h-40 sm:w-40" />

          <div className="flex w-full flex-1 flex-col gap-5">

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold text-slate-900 sm:text-base"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Masukkan email"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-bold text-slate-900 sm:text-base"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Masukkan Password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute inset-y-0 right-0 flex items-center rounded-md pr-4 text-slate-400 transition hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:text-blue-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="mt-2 text-right">
                <a
                  href="#lupa-password"
                  className="text-xs font-medium text-slate-600 transition hover:text-blue-500 sm:text-sm"
                >
                  Lupa password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-blue-500 px-6 py-3.5 text-sm font-bold text-white shadow-md transition duration-200 hover:bg-blue-600 active:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:text-base"
            >
              Masuk
            </button>

            <p className="text-center text-sm text-slate-700 sm:text-base">
              Belum punya akun?{' '}
              <a
                href="#daftar"
                className="font-semibold text-teal-500 transition hover:text-teal-600"
              >
                Daftar di sini
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}