import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
  LogIn,
  UserRound,
  Search,
  Lock,
} from "lucide-react";
import { CekbarLogo, CekbarIcon } from "@/components/ui/cekbar-logo";
import { useRedirectIfLoggedIn } from "@/hooks/use-redirect-if-logged-in";

export default function LoginPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useRedirectIfLoggedIn();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Error ${res.status}`);
        return;
      }

      if (data.user?.role === "admin" || data.user?.role === "superadmin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen lg:grid lg:min-h-[100svh] lg:grid-cols-2"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #1d4ed8 100%)" }}
    >
      <section className="relative hidden lg:flex flex-col overflow-hidden px-12 py-11 xl:px-16 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-28 -z-10 h-[34rem] w-[34rem] rounded-full border border-white/[0.08]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-12 -z-10 h-[25rem] w-[25rem] rounded-full border border-white/[0.08]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-44 -left-28 -z-10 h-[30rem] w-[30rem] rounded-full bg-blue-400/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.6)_0.7px,transparent_0.7px)] [background-size:20px_20px]" />

        <div className="relative flex items-center justify-between">
          <Link to="/" className="group inline-flex items-center gap-3 rounded-xl">
            <CekbarLogo variant="dark" size="md" subtitle="IMEI VERIFICATION" />
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-2 text-xs font-medium text-blue-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            Layanan IMEI &amp; GSM
          </div>
        </div>

        <div className="relative my-auto py-12">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-sky-100">
            <Activity size={14} />
            VERIFIKASI IMEI RESMI INDONESIA
          </div>
          <h1 className="max-w-xl text-[2.45rem] font-bold leading-[1.12] tracking-[-0.045em] sm:text-5xl xl:text-[3.1rem]">
            Pastikan perangkat Anda{" "}
            <span className="text-sky-300">asli &amp; legal</span>{" "}
            sebelum membeli.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-blue-100/75 sm:text-base sm:leading-7">
            Satu akun untuk mengakses layanan cek IMEI, verifikasi Bea Cukai,
            Apple Carrier Check, dan memantau riwayat pengecekan Anda.
          </p>

          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 backdrop-blur-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-300/10 text-sky-200">
                <Fingerprint size={20} />
              </span>
              <span className="text-sm font-medium leading-5 text-white/90">Verifikasi IMEI terintegrasi</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 backdrop-blur-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-300/10 text-sky-200">
                <Search size={20} />
              </span>
              <span className="text-sm font-medium leading-5 text-white/90">Cek status CEIR resmi</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 backdrop-blur-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-300/10 text-sky-200">
                <Lock size={20} />
              </span>
              <span className="text-sm font-medium leading-5 text-white/90">Cek Bea Cukai &amp; Carrier</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 backdrop-blur-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-300/10 text-sky-200">
                <Activity size={20} />
              </span>
              <span className="text-sm font-medium leading-5 text-white/90">Pantau riwayat pengecekan</span>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-xs text-blue-100/65">
          <span>Platform verifikasi IMEI Cekbar</span>
          <span>Kelola layanan dari satu akun</span>
        </div>
      </section>

      <section className="relative flex min-h-screen lg:min-h-[100svh] items-center justify-center bg-white px-5 py-10 sm:px-10 lg:px-12 xl:px-16">

        <div className="absolute top-0 left-0 right-0 lg:hidden"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)" }}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <CekbarLogo variant="dark" size="sm" />
            </Link>
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-medium text-blue-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Verifikasi IMEI
            </div>
          </div>
        </div>

        <div className="w-full max-w-[420px] pt-16 lg:pt-0">
          <div className="mb-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <LogIn size={22} strokeWidth={2.1} />
            </div>
            <p className="text-sm font-semibold text-blue-700">Selamat datang kembali</p>
            <h2 className="mt-1.5 text-[1.9rem] font-bold tracking-[-0.04em] text-slate-900 sm:text-[2.15rem]">
              Masuk ke akun Anda
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Masuk menggunakan email atau username Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login" className="mb-2 block text-sm font-semibold text-slate-700">
                Email / Username
              </label>
              <div className="relative">
                <UserRound aria-hidden="true" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login"
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  className="h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Email atau username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
              ) : (
                <>
                  Masuk ke dashboard
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="text-right mt-3 relative z-10">
            <Link to="/lupa-password" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition-colors">
              Lupa password?
            </Link>
          </div>
          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            <span>Akun Cekbar</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <p className="text-center text-sm text-slate-500">
            Belum punya akun?{" "}
            <Link to="/register" className="font-semibold text-blue-700 decoration-blue-300 underline-offset-4 transition hover:text-blue-800 hover:underline">
              Daftar sekarang
            </Link>
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <CekbarIcon size={16} />
            <span>Platform verifikasi IMEI resmi Indonesia</span>
          </div>
        </div>
      </section>
    </main>
  );
}
