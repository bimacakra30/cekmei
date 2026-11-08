import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Send,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { CekbarLogo } from "@/components/ui/cekbar-logo";

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const contactInfos = [
  {
    icon: Mail,
    title: "Email",
    value: "support@barasystem.id",
    desc: "Kami merespons dalam 1×24 jam",
    href: "mailto:support@barasystem.id",
    color: "from-blue-500 to-blue-700",
    glow: "shadow-blue-600/25",
  },
  {
    icon: Send,
    title: "Telegram",
    value: "@cekbar",
    desc: "Chat langsung dengan tim kami",
    href: "https://t.me/cekbar",
    color: "from-sky-400 to-sky-600",
    glow: "shadow-sky-500/25",
  },
  {
    icon: Clock,
    title: "Jam Operasional",
    value: "Setiap Hari",
    desc: "10.00 – 21.00 WIB",
    href: null,
    color: "from-violet-500 to-violet-700",
    glow: "shadow-violet-600/25",
  },
];

export function KontakPage() {
  const heroRef = useReveal(0);
  const infoRef = useReveal(0.1);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 40%, #f8faff 100%)" }}>

      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-blue-100/60 shadow-sm">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <CekbarLogo variant="light" size="sm" />
          </Link>
          <Link to="/"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft size={15} />
            Kembali ke Beranda
          </Link>
        </div>
      </header>

      <section className="pt-32 pb-16 px-5 sm:px-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-[0.07] rounded-full"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }} />

        <div
          ref={heroRef.ref}
          className={`relative transition-all duration-700 ${heroRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">Hubungi Kami</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
            Ada yang bisa kami{" "}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #1d4ed8, #60a5fa)" }}>
              bantu?
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            Tim kami siap membantu Anda seputar verifikasi IMEI, kendala akun, atau pertanyaan tentang layanan Cekbar.
          </p>
        </div>
      </section>

      <section className="pb-12 px-5 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div
            ref={infoRef.ref}
            className={`grid sm:grid-cols-3 gap-5 transition-all duration-700 ${infoRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            {contactInfos.map((info, i) => {
              const Icon = info.icon;
              const content = (
                <div
                  className="group flex flex-col items-center text-center p-7 bg-white rounded-2xl border border-blue-100 shadow-sm hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${info.color} shadow-lg ${info.glow} mb-5`}>
                    <Icon size={24} className="text-white" strokeWidth={1.8} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{info.title}</p>
                  <p className="text-base font-bold text-slate-900 mb-1">{info.value}</p>
                  <p className="text-sm text-slate-500">{info.desc}</p>
                </div>
              );
              return info.href ? (
                <a key={info.title} href={info.href} target="_blank" rel="noopener noreferrer">{content}</a>
              ) : (
                <div key={info.title}>{content}</div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-blue-100 py-8 px-5 text-center"
        style={{ background: "linear-gradient(180deg, #f0f9ff 0%, #dbeafe 100%)" }}>
        <p className="text-sm text-slate-400">
          &copy; {new Date().getFullYear()} Cekbar. Semua hak dilindungi.
        </p>
      </footer>
    </div>
  );
}
