import { useReveal, useCounter } from "./landing-hooks";

function StatItem({ value, suffix, label, delay, start }: { value: number; suffix: string; label: string; delay: number; start: boolean }) {
  const count = useCounter(value, 1400, start);
  return (
    <div
      className={`text-center transition-all duration-700 ${start ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
        {count.toLocaleString("id-ID")}{suffix}
      </p>
      <div className="w-8 h-0.5 bg-blue-400/50 rounded mx-auto my-2" />
      <p className="text-sm text-blue-300 font-medium">{label}</p>
    </div>
  );
}

export function Stats() {
  const { ref, visible } = useReveal(0.2);
  const stats = [
    { value: 10000, suffix: "+", label: "Transaksi diproses" },
    { value: 99, suffix: ".9%", label: "Uptime layanan" },
    { value: 3, suffix: " jam", label: "Rata-rata proses" },
    { value: 24, suffix: "/7", label: "Layanan tersedia" },
  ];

  return (
    <section className="py-16 sm:py-20 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)" }}
    >
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {stats.map((s, i) => (
            <StatItem key={s.label} value={s.value} suffix={s.suffix} label={s.label} delay={i * 120} start={visible} />
          ))}
        </div>
      </div>
    </section>
  );
}
