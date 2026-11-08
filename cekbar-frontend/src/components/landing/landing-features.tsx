import {
  ShieldCheck,
  Search,
  Globe,
  Fingerprint,
  Lock,
  CreditCard,
} from "lucide-react";
import { useReveal } from "./landing-hooks";

const FEATURES = [
  { icon: Search, title: "Cek Status IMEI", desc: "Verifikasi IMEI perangkat di database CEIR resmi Indonesia. Pastikan perangkat tidak terblokir dan terdaftar secara legal.", color: "from-blue-500 to-blue-700", bg: "bg-blue-50", border: "border-blue-100" },
  { icon: Globe, title: "Cek Validity Roamer", desc: "Periksa apakah IMEI aktif sebagai roamer dan cek masa berlakunya. Informasi akurat langsung dari sistem resmi.", color: "from-cyan-500 to-cyan-700", bg: "bg-cyan-50", border: "border-cyan-100" },
  { icon: Fingerprint, title: "Apple Carrier & SIMLock", desc: "Cek status carrier lock dan SIMLock perangkat Apple. Ketahui apakah iPhone yang Anda beli bisa digunakan bebas di Indonesia.", color: "from-indigo-500 to-indigo-700", bg: "bg-indigo-50", border: "border-indigo-100" },
  { icon: Lock, title: "Cek IMEI Bea Cukai", desc: "Verifikasi apakah perangkat sudah terdaftar resmi di Bea Cukai Indonesia. Hindari perangkat ilegal yang bisa diblokir sewaktu-waktu.", color: "from-sky-500 to-sky-700", bg: "bg-sky-50", border: "border-sky-100" },
  { icon: ShieldCheck, title: "Lindungi dari Penipuan", desc: "Jangan beli perangkat bekas tanpa verifikasi. Cek IMEI sebelum transaksi untuk memastikan perangkat aman dan tidak bermasalah.", color: "from-emerald-500 to-teal-700", bg: "bg-emerald-50", border: "border-emerald-100" },
  { icon: CreditCard, title: "Pembayaran via QRIS", desc: "Proses cepat, bayar langsung via QRIS. Tanpa ribet, tanpa daftar kartu — cukup scan dan selesai.", color: "from-violet-500 to-purple-700", bg: "bg-violet-50", border: "border-violet-100" },
];

export function Features() {
  const { ref: titleRef, visible: titleVisible } = useReveal(0.2);
  const { ref: gridRef, visible: gridVisible } = useReveal(0.1);

  return (
    <section id="layanan" className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">

        <div ref={titleRef} className="max-w-2xl mx-auto text-center mb-14 sm:mb-16">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-4 transition-all duration-500 ${titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">Layanan</span>
          </div>
          <h2 className={`lp-heading-line text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 transition-all duration-600 delay-100 ${titleVisible ? "opacity-100 translate-y-0 lp-visible" : "opacity-0 translate-y-4"}`}>
            Verifikasi IMEI perangkat Anda sebelum membeli
          </h2>
          <p className={`mt-4 text-base sm:text-lg text-slate-500 leading-relaxed transition-all duration-600 delay-200 ${titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            Jangan ambil risiko membeli perangkat ilegal atau bermasalah. Cek keaslian dan legalitas IMEI hanya dalam hitungan detik.
          </p>
        </div>

        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`lp-card group ${f.bg} ${f.border} border rounded-2xl p-6 sm:p-7 transition-all ${gridVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              style={{ transitionDuration: "550ms", transitionDelay: gridVisible ? `${i * 70}ms` : "0ms" }}
            >
              <div className={`lp-icon-glow inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} text-white mb-5 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]`}>
                <f.icon size={22} strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
