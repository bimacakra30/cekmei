import {
  Users,
  Search,
  Fingerprint,
  CheckCircle,
} from "lucide-react";
import { useReveal } from "./landing-hooks";

const STEPS = [
  { step: "01", title: "Buat Akun", desc: "Daftar akun Cekbar secara gratis. Cukup email dan password, langsung bisa digunakan.", icon: Users },
  { step: "02", title: "Pilih Layanan", desc: "Pilih jenis pengecekan yang Anda butuhkan — status CEIR, Apple Carrier, Bea Cukai, dan lainnya.", icon: Search },
  { step: "03", title: "Masukkan IMEI", desc: "Input nomor IMEI perangkat yang ingin dicek. Nomor IMEI biasanya tertera di kotak atau pengaturan perangkat.", icon: Fingerprint },
  { step: "04", title: "Bayar & Lihat Hasil", desc: "Bayar via QRIS, dan hasil verifikasi langsung tampil. Proses cepat, akurat, dan terpercaya.", icon: CheckCircle },
];

export function HowItWorks() {
  const { ref: titleRef, visible: titleVisible } = useReveal(0.2);
  const { ref: stepsRef, visible: stepsVisible } = useReveal(0.1);

  return (
    <section id="cara-kerja" className="py-20 sm:py-28 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)" }}
    >
      <div aria-hidden="true" className="absolute top-0 right-0 w-[400px] h-[400px] opacity-[0.08] rounded-full"
        style={{ background: "radial-gradient(circle, #1D4ED8, transparent 70%)", transform: "translate(30%, -30%)" }} />
      <div aria-hidden="true" className="absolute bottom-0 left-0 w-[300px] h-[300px] opacity-[0.08] rounded-full"
        style={{ background: "radial-gradient(circle, #1D4ED8, transparent 70%)", transform: "translate(-30%, 30%)" }} />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div ref={titleRef} className="max-w-2xl mx-auto text-center mb-14 sm:mb-16">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 border border-blue-200 mb-4 transition-all duration-500 ${titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">Cara Kerja</span>
          </div>
          <h2 className={`lp-heading-line text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 transition-all duration-600 delay-100 ${titleVisible ? "opacity-100 translate-y-0 lp-visible" : "opacity-0 translate-y-4"}`}>
            Empat langkah sederhana
          </h2>
          <p className={`mt-4 text-base sm:text-lg text-slate-500 leading-relaxed transition-all duration-600 delay-200 ${titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            Proses yang mudah dan transparan dari awal hingga akhir.
          </p>
        </div>

        <div ref={stepsRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {STEPS.map((item, i) => (
            <div
              key={item.step}
              className={`relative transition-all ${stepsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDuration: "600ms", transitionDelay: stepsVisible ? `${i * 100}ms` : "0ms" }}
            >
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`hidden lg:block absolute top-8 left-[calc(50%+32px)] h-px overflow-hidden transition-all duration-700 ${stepsVisible ? "w-[calc(100%-64px)]" : "w-0"}`}
                  style={{ transitionDelay: stepsVisible ? `${i * 100 + 400}ms` : "0ms" }}
                >
                  <div className="lp-connector h-full w-full" />
                </div>
              )}

              <div className="text-center">
                <div className="relative inline-flex mb-5">
                  <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-600/30">
                    <item.icon size={24} className="text-white" strokeWidth={1.8} />
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-blue-600 text-[10px] font-black text-blue-700 shadow-sm">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 max-w-xs mx-auto">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
