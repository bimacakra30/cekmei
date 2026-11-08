export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl" />
      </div>

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 text-center max-w-lg w-full">

        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-blue-400 animate-spin"
                style={{ animationDuration: "8s" }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-2xl border border-blue-500/30 animate-ping" style={{ animationDuration: "2s" }} />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-medium text-amber-400 tracking-wide uppercase">Dalam Pemeliharaan</span>
        </div>

        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
          Segera Kembali
        </h1>

        <p className="text-base text-slate-400 leading-relaxed mb-8">
          Kami sedang melakukan pemeliharaan sistem untuk meningkatkan
          performa dan pengalaman Anda. Terima kasih atas kesabaran Anda.
        </p>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-700" />
          <span className="text-xs text-slate-600">CEKBAR</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-700" />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: "🔧", label: "Pemeliharaan", desc: "Sistem diperbarui" },
            { icon: "⚡", label: "Performa", desc: "Ditingkatkan" },
            { icon: "🛡️", label: "Keamanan", desc: "Diperkuat" },
          ].map((item) => (
            <div
              key={item.label}
              className="p-3 rounded-xl bg-white/[0.03] border border-white/5"
            >
              <div className="text-xl mb-1">{item.icon}</div>
              <p className="text-xs font-semibold text-white">{item.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} Cekbar. All rights reserved.
        </p>
      </div>
    </div>
  );
}
