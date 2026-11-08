import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  UserPlus,
  UserRound,
  Search,
  Lock,
  AtSign,
  Phone,
  User,
} from "lucide-react";
import { CekbarLogo, CekbarIcon } from "@/components/ui/cekbar-logo";
import { useRedirectIfLoggedIn } from "@/hooks/use-redirect-if-logged-in";

export default function RegisterPage() {
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [noHp, setNoHp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [verified, setVerified] = useState(false);

  const [otpStep, setOtpStep] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
    if (pw.length === 0) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score, label: "Sangat lemah", color: "bg-red-500" };
    if (score === 2) return { score, label: "Lemah", color: "bg-orange-400" };
    if (score === 3) return { score, label: "Cukup", color: "bg-yellow-400" };
    if (score === 4) return { score, label: "Kuat", color: "bg-blue-500" };
    return { score, label: "Sangat kuat", color: "bg-emerald-500" };
  }
  const pwStrength = getPasswordStrength(password);

  useRedirectIfLoggedIn();

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          username,
          email,
          no_hp: noHp,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setRegisteredEmail(data.email || email);
      setOtpStep(true);
      setResendCooldown(60);
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpError("");
    setOtpLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error);
        return;
      }
      setVerified(true);
      setSuccess(true);
    } catch {
      setOtpError("Gagal terhubung ke server");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setOtpError("");
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error);
        return;
      }
      setResendCooldown(60);
    } catch {
      setOtpError("Gagal mengirim ulang");
    }
  }

  return (
    <main
      className="min-h-screen lg:grid lg:min-h-[100svh] lg:grid-cols-2"
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
            MULAI DENGAN AKUN CEKBAR
          </div>
          <h1 className="max-w-xl text-[2.45rem] font-bold leading-[1.12] tracking-[-0.045em] sm:text-5xl xl:text-[3.1rem]">
            Cek IMEI perangkat,{" "}
            <span className="text-sky-300">satu akun.</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-blue-100/75 sm:text-base sm:leading-7">
            Buat akun gratis untuk mengakses layanan verifikasi IMEI, cek Bea Cukai,
            Apple Carrier, dan memantau riwayat pengecekan Anda.
          </p>

          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
            {[
              { icon: Fingerprint, text: "Verifikasi IMEI resmi" },
              { icon: Search,      text: "Cek status CEIR resmi" },
              { icon: Lock,        text: "Apple Carrier & Bea Cukai" },
              { icon: Activity,    text: "Pantau riwayat pengecekan" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-300/10 text-sky-200">
                  <Icon size={20} />
                </span>
                <span className="text-sm font-medium leading-5 text-white/90">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-xs text-blue-100/65">
          <span>Platform verifikasi IMEI Cekbar</span>
          <span>Mulai dengan membuat akun</span>
        </div>
      </section>

      <section className="relative flex min-h-screen lg:min-h-[100svh] items-start lg:items-center justify-center bg-white px-5 pb-10 pt-0 sm:px-10 lg:px-12 xl:px-16">

        <div
          className="fixed top-0 left-0 right-0 z-10 lg:hidden"
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

        <div className="w-full max-w-[420px] pt-20 pb-6 lg:py-10">
          <div className="mb-6">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <UserPlus size={22} strokeWidth={2.1} />
            </div>
            <p className="text-sm font-semibold text-blue-700">Bergabung dengan Cekbar</p>
            <h2 className="mt-1.5 text-[1.75rem] font-bold tracking-[-0.04em] text-slate-900 sm:text-[2rem]">
              Buat akun baru
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Isi detail berikut untuk mulai menggunakan platform.
            </p>
          </div>

          {verified ? (
            <div role="status" aria-live="polite" className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={25} />
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">Email Terverifikasi!</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Akun <span className="font-semibold text-slate-800">{nama}</span> sudah aktif. Silakan masuk untuk melanjutkan.
              </p>
              <Link to="/login"
                className="group mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-500 hover:to-blue-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25"
              >
                Lanjut ke halaman masuk
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          ) : otpStep ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-5">
                <h3 className="text-lg font-bold text-slate-900">Verifikasi Email</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Kami telah mengirimkan kode 6 digit ke <strong className="text-slate-800">{registeredEmail}</strong>.
                  Masukkan kode tersebut untuk mengaktifkan akun Anda.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {otpError && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {otpError}
                  </div>
                )}

                <div>
                  <label htmlFor="otp" className="mb-1.5 block text-sm font-semibold text-slate-700">Kode Verifikasi</label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="h-14 w-full rounded-xl border border-slate-300 bg-white text-center text-2xl font-bold tracking-[0.4em] text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || otp.length < 6}
                  className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-500 hover:to-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {otpLoading ? (
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  ) : (
                    "Verifikasi"
                  )}
                </button>
              </form>

              <div className="text-center">
                <p className="text-sm text-slate-500">
                  Tidak menerima kode?{" "}
                  {resendCooldown > 0 ? (
                    <span className="text-slate-400">Kirim ulang dalam {resendCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="font-semibold text-blue-700 hover:text-blue-800 hover:underline underline-offset-4"
                    >
                      Kirim ulang
                    </button>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="nama" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User aria-hidden="true" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="nama"
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    autoComplete="name"
                    required
                    className="h-[50px] w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    placeholder="Nama lengkap Anda"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Username
                </label>
                <div className="relative">
                  <UserRound aria-hidden="true" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    className="h-[50px] w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    placeholder="Buat username unik"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Email
                </label>
                <div className="relative">
                  <AtSign aria-hidden="true" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="h-[50px] w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    placeholder="email@contoh.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="no_hp" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Nomor HP
                </label>
                <div className="relative">
                  <Phone aria-hidden="true" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="no_hp"
                    type="tel"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    autoComplete="tel"
                    required
                    className="h-[50px] w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    placeholder="081234567890"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    className="h-[50px] w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    placeholder="Minimal 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= pwStrength.score ? pwStrength.color : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${
                      pwStrength.score <= 1 ? "text-red-500" :
                      pwStrength.score === 2 ? "text-orange-400" :
                      pwStrength.score === 3 ? "text-yellow-500" :
                      pwStrength.score === 4 ? "text-blue-500" : "text-emerald-500"
                    }`}>{pwStrength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    className={`h-[50px] w-full rounded-xl border bg-slate-50/70 px-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:ring-4 ${
                      confirmPassword.length > 0 && confirmPassword !== password
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                        : confirmPassword.length > 0 && confirmPassword === password
                        ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/10"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
                    }`}
                    placeholder="Ulangi password Anda"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? "Sembunyikan" : "Tampilkan"}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword.length > 0 && confirmPassword !== password && (
                  <p className="mt-1.5 text-xs text-red-500">Password tidak cocok</p>
                )}
                {confirmPassword.length > 0 && confirmPassword === password && (
                  <p className="mt-1.5 text-xs text-emerald-500">Password cocok ✓</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group mt-1 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                ) : (
                  <>
                    Buat akun
                    <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {!success && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                <span>Sudah punya akun?</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <p className="text-center text-sm text-slate-500">
                <Link to="/login" className="font-semibold text-blue-700 decoration-blue-300 underline-offset-4 transition hover:text-blue-800 hover:underline">
                  Masuk di sini
                </Link>
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <CekbarIcon size={16} />
                <span>Platform verifikasi IMEI resmi Indonesia</span>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
