import { useState } from "react";
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error || "Terjadi kesalahan");
      }
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl border border-border shadow-xl p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Cek Email Anda</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Jika email <strong className="text-foreground">{email}</strong> terdaftar,
                kami telah mengirimkan link untuk reset password.
                Cek inbox dan folder spam Anda.
              </p>
              <p className="text-xs text-muted-foreground/60">Link berlaku selama 1 jam</p>
              <Link to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2"
              >
                <ArrowLeft size={14} />
                Kembali ke Login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-foreground">Lupa Password?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Masukkan email yang terdaftar, kami akan kirimkan link reset password
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contoh@email.com"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400">
                    <AlertCircle size={15} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  Kirim Link Reset
                </button>
              </form>

              <div className="text-center mt-5">
                <Link to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={14} />
                  Kembali ke Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
