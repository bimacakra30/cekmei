import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useReveal } from "./landing-hooks";

export function CTA() {
  const { ref, visible } = useReveal(0.2);

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div
          ref={ref}
          className={`relative rounded-3xl px-6 sm:px-12 py-14 sm:py-20 text-center overflow-hidden transition-all duration-700 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"}`}
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0369a1 100%)" }}
        >
          <div aria-hidden="true" className="absolute top-0 left-0 w-[300px] h-[300px] opacity-20 rounded-full"
            style={{ background: "radial-gradient(circle, #93c5fd, transparent 70%)", transform: "translate(-40%, -40%)" }} />
          <div aria-hidden="true" className="absolute bottom-0 right-0 w-[250px] h-[250px] opacity-20 rounded-full"
            style={{ background: "radial-gradient(circle, #38bdf8, transparent 70%)", transform: "translate(40%, 40%)" }} />
          <div aria-hidden="true" className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />

          <div className="relative">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6 transition-all duration-500 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold text-blue-100">Terpercaya & Akurat</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl font-black tracking-tight text-white transition-all duration-600 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              Cek IMEI sebelum terlambat
            </h2>
            <p className={`mt-4 text-base sm:text-lg text-blue-200 max-w-xl mx-auto leading-relaxed transition-all duration-600 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              Ribuan perangkat beredar tanpa status yang jelas. Pastikan perangkat Anda aman, legal, dan tidak akan diblokir — sebelum Anda menyesal.
            </p>
            <div className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 transition-all duration-600 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <Link to="/register"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-[15px] font-bold text-blue-900 bg-white rounded-xl shadow-2xl shadow-black/20 transition-all duration-200 hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.97]">
                Daftar Akun Gratis
                <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-[15px] font-semibold text-white bg-white/10 backdrop-blur-sm border border-white/25 rounded-xl transition-all duration-200 hover:bg-white/20">
                Sudah punya akun? Masuk
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
