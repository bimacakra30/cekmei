import { Mail, Send, Clock } from "lucide-react";
import { useReveal } from "./landing-hooks";

export function Kontak() {
  const { ref, visible } = useReveal(0.1);

  const contactItems = [
    {
      icon: Mail,
      title: "Email",
      value: "support@barasystem.id",
      desc: "Respons dalam 1×24 jam",
      href: "mailto:support@barasystem.id",
      color: "from-blue-500 to-blue-700",
    },
    {
      icon: Send,
      title: "Telegram",
      value: "@cekbar",
      desc: "Chat langsung dengan tim kami",
      href: "https://t.me/cekbar",
      color: "from-sky-400 to-sky-600",
    },
    {
      icon: Clock,
      title: "Jam Operasional",
      value: "Setiap Hari",
      desc: "10.00 – 21.00 WIB",
      href: null,
      color: "from-violet-500 to-violet-700",
    },
  ];

  return (
    <section id="kontak" className="py-20 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div
          ref={ref}
          className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">Hubungi Kami</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-4">
              Ada yang bisa kami{" "}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #1d4ed8, #60a5fa)" }}>
                bantu?
              </span>
            </h2>
            <p className="text-base text-slate-500 max-w-lg mx-auto">
              Tim kami siap membantu Anda seputar verifikasi IMEI, kendala akun, atau pertanyaan tentang layanan.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {contactItems.map((item) => {
              const Icon = item.icon;
              const card = (
                <div className="flex flex-col items-center text-center p-8 bg-white rounded-2xl border border-blue-100 shadow-sm hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 h-full lp-card">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-lg mb-5`}>
                    <Icon size={24} className="text-white" strokeWidth={1.8} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{item.title}</p>
                  <p className="text-base font-bold text-slate-900 mb-1">{item.value}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              );
              return item.href ? (
                <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer" className="block">{card}</a>
              ) : (
                <div key={item.title}>{card}</div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
