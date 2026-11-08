import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Search,
  Globe,
  ArrowRight,
  Fingerprint,
  Lock,
  CreditCard,
  CheckCircle,
  Star,
  Zap,
  BadgeCheck,
  Clock,
} from "lucide-react";

export function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-center pt-16 pb-20 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #1d4ed8 70%, #0369a1 100%)" }}
    >
      <div aria-hidden="true" className="lp-blob absolute top-[-10%] left-[-5%] w-[500px] h-[500px] opacity-20 rounded-full"
        style={{ background: "radial-gradient(circle, #60a5fa, transparent 70%)" }} />
      <div aria-hidden="true" className="lp-float-rev absolute bottom-[-5%] right-[-5%] w-[450px] h-[450px] opacity-15 rounded-full"
        style={{ background: "radial-gradient(circle, #38bdf8, transparent 70%)", animationDelay: "2s" }} />
      <div aria-hidden="true" className="lp-blob absolute top-[30%] right-[15%] w-[300px] h-[300px] opacity-10 rounded-full"
        style={{ background: "radial-gradient(circle, #a78bfa, transparent 70%)", animationDelay: "3s" }} />

      <div aria-hidden="true" className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />

      <div aria-hidden="true" className={`lp-float absolute top-[22%] left-[6%] hidden lg:flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 transition-all duration-1000 delay-700 ${mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/20 border border-emerald-400/30">
          <CheckCircle size={16} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-[11px] text-blue-200 font-medium">Status IMEI</p>
          <p className="text-xs text-white font-bold">Terdaftar Legal ✓</p>
        </div>
      </div>

      <div aria-hidden="true" className={`lp-float-rev absolute top-[18%] right-[6%] hidden lg:flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 transition-all duration-1000 delay-900 ${mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-400/20 border border-blue-400/30">
          <ShieldCheck size={16} className="text-blue-300" />
        </div>
        <div>
          <p className="text-[11px] text-blue-200 font-medium">Bea Cukai</p>
          <p className="text-xs text-white font-bold">Resmi Terdaftar ✓</p>
        </div>
      </div>

      <div aria-hidden="true" className={`lp-float absolute bottom-[25%] left-[8%] hidden lg:flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 transition-all duration-1000 delay-[1100ms] ${mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 border border-amber-400/30">
          <Star size={16} className="text-amber-400" />
        </div>
        <div>
          <p className="text-[11px] text-blue-200 font-medium">10.000+</p>
          <p className="text-xs text-white font-bold">Cek Berhasil</p>
        </div>
      </div>

      <div aria-hidden="true" className={`lp-float-rev absolute bottom-[28%] right-[7%] hidden lg:flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 transition-all duration-1000 delay-[1300ms] ${mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/20 border border-cyan-400/30">
          <Zap size={16} className="text-cyan-400" />
        </div>
        <div>
          <p className="text-[11px] text-blue-200 font-medium">Hasil Instan</p>
          <p className="text-xs text-white font-bold">Real-time CEIR</p>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 w-full">
        <div className="max-w-3xl mx-auto text-center">

          <div className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="lp-badge-glow inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: "lp-pulse-dot 2s ease-in-out infinite" }} />
              <span className="text-xs font-semibold text-blue-100 tracking-wide">Platform verifikasi IMEI resmi Indonesia</span>
            </div>
          </div>

          <h1 className={`text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-white transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            Pastikan perangkat Anda{" "}
            <span className="lp-gradient-text">asli & legal</span>{" "}
            sebelum membeli
          </h1>

          <p className={`mt-6 text-lg sm:text-xl leading-relaxed text-blue-200 max-w-2xl mx-auto transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
            Cek status IMEI di database CEIR resmi, verifikasi Apple Carrier,
            dan pastikan perangkat terdaftar legal di Bea Cukai Indonesia.
          </p>

          <div className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
            <Link to="/login"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-[15px] font-bold text-blue-900 bg-white rounded-xl shadow-2xl shadow-white/20 transition-all duration-200 hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.97]"
            >
              Cek IMEI Sekarang
              <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-[15px] font-semibold text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl transition-all duration-200 hover:bg-white/20"
            >
              Masuk ke Akun
            </Link>
          </div>

          <div className={`mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 transition-all duration-700 delay-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
            {[
              { icon: CheckCircle, text: "Database CEIR Resmi" },
              { icon: BadgeCheck, text: "Verifikasi Bea Cukai" },
              { icon: Clock, text: "Hasil Instan" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 text-sm text-blue-200">
                <Icon size={14} className="text-emerald-400" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 leading-none">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full">
          <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 37.3C840 43 960 53 1080 58.7C1200 64 1320 64 1380 64L1440 64V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
