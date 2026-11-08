import { AlertTriangle, ShieldAlert, Info, Clock, MessageCircleWarning, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
const sections = [
  {
    icon: Clock,
    title: "Estimasi Waktu Proses",
    color: "text-blue-500",
    content: (
      <div className="text-sm leading-relaxed text-foreground space-y-1">
        <p className="font-semibold">Proses 1 Sampai 2 Hari</p>
        <p className="text-muted-foreground">Pengerjaan 30 menit - 3 jam, maksimal 1 hari jika antrian full.</p>
      </div>
    ),
  },
  {
    icon: AlertTriangle,
    title: "Aturan Utama",
    color: "text-amber-500",
    content: (
      <ul className="space-y-2.5 text-sm text-foreground/90 leading-relaxed">
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5 shrink-0">●</span>
          <span>Pastikan status CEIR adalah <span className="font-semibold text-emerald-600 dark:text-emerald-400">UNKNOWN</span> sebelum melakukan Add Roamer.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-amber-500 mt-0.5 shrink-0">●</span>
          <span>IMEI wajib diketik/input dengan benar.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-red-500 mt-0.5 shrink-0">●</span>
          <span className="font-medium text-red-600 dark:text-red-400">Tidak Ada Refund jika terjadi kesalahan ketik/input IMEI.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-amber-500 mt-0.5 shrink-0">●</span>
          <span>Wajib melakukan pengecekan status CEIR secara mandiri sebelum melakukan pesanan Add Roamer.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-red-500 mt-0.5 shrink-0">●</span>
          <span className="font-medium text-red-600 dark:text-red-400">Jika status IMEI sudah terdaftar di KEMENPERIN / BEACUKAI jangan dilanjutkan.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-red-500 mt-0.5 shrink-0">●</span>
          <span className="font-medium text-red-600 dark:text-red-400">Tidak ada refund jika IMEI yang diinput adalah bekas Kemenperin / BEACUKAI / (status registered) saat cek Status CEIR.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-amber-500 mt-0.5 shrink-0">●</span>
          <span>Jika status IMEI masih roamer / aktif jangan input Add Roamer.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-red-500 mt-0.5 shrink-0">●</span>
          <span className="font-medium text-red-600 dark:text-red-400">Tidak ada refund jika IMEI yang diinput dalam status masih roamer, jika sinyal hilang / auto remove roamer mengikuti add roamer yang lama/sebelumnya.</span>
        </li>
      </ul>
    ),
  },
  {
    icon: ShieldAlert,
    title: "Kasus Lain yang Tidak Ada Refund",
    color: "text-red-500",
    content: (
      <ul className="space-y-2.5 text-sm leading-relaxed">
        <li className="flex items-start gap-2">
          <span className="text-red-500 mt-0.5 shrink-0">●</span>
          <span className="text-foreground/90">Kerusakan pada Hardware — <span className="font-semibold text-red-600 dark:text-red-400">NO REFUND</span>.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-red-500 mt-0.5 shrink-0">●</span>
          <span className="text-foreground/90">iPhone status Ex-Bypass / WiFi Only — <span className="font-semibold text-red-600 dark:text-red-400">NO REFUND</span>.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-red-500 mt-0.5 shrink-0">●</span>
          <span className="text-foreground/90">Perangkat terkunci operator / SIM Lock — <span className="font-semibold text-red-600 dark:text-red-400">NO REFUND</span>.</span>
        </li>
      </ul>
    ),
  },
  {
    icon: Info,
    title: "Informasi Tentang Pesanan Sukses",
    color: "text-emerald-500",
    content: (
      <p className="text-sm text-foreground/90 leading-relaxed">
        <span className="text-emerald-500 mr-2">●</span>
        Status <span className="font-semibold text-emerald-600 dark:text-emerald-400">ROAMER</span> dianggap sebagai pesanan yang <span className="font-semibold">AKTIF / SELESAI / BERHASIL</span>.
      </p>
    ),
  },
  {
    icon: Info,
    title: "Penjelasan Pesanan Pending Dan Proses",
    color: "text-blue-500",
    content: (
      <ul className="space-y-2.5 text-sm text-foreground/90 leading-relaxed">
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5 shrink-0">●</span>
          <span><span className="font-semibold text-blue-600 dark:text-blue-400">Pending</span>: Sudah masuk List.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5 shrink-0">●</span>
          <span><span className="font-semibold text-blue-600 dark:text-blue-400">Proses</span>: Sudah Masuk Antrian Dan Segera Di Proses.</span>
        </li>
      </ul>
    ),
  },
  {
    icon: MessageCircleWarning,
    title: "Catatan Tambahan",
    color: "text-amber-500",
    content: (
      <ul className="space-y-2.5 text-sm text-foreground/90 leading-relaxed">
        <li className="flex items-start gap-2">
          <span className="text-amber-500 mt-0.5 shrink-0">●</span>
          <span>Selama pesanan masih dalam pending/proses, harap <span className="font-semibold">tidak mengirim spam pertanyaan</span> ke admin.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-amber-500 mt-0.5 shrink-0">●</span>
          <span>Pesanan yang sudah masuk ke dalam sistem <span className="font-semibold">tidak dapat dibatalkan</span>/saldo tidak bisa di tarik dengan alasan apapun.</span>
        </li>
      </ul>
    ),
  },
  {
    icon: Clock,
    title: "Proses Add Roamer",
    color: "text-blue-500",
    content: (
      <ul className="space-y-2.5 text-sm text-foreground/90 leading-relaxed">
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5 shrink-0">●</span>
          <span>Rata-rata Selesai di bawah <span className="font-semibold">12 Jam</span> Tergantung Antrian.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5 shrink-0">●</span>
          <span>Maksimal Proses <span className="font-semibold">1x24 Jam</span> Jika Tidak Ada Gangguan.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5 shrink-0">●</span>
          <span>Add Roamer dikerjakan mulai dari <span className="font-semibold">Jam 10:00</span> Hingga Limit/close.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5 shrink-0">●</span>
          <span>Jika Pesanan Masuk Setelah Close, Maka Akan Diproses Di Hari Berikutnya.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5 shrink-0">●</span>
          <span>Jika IMEI di input setelah jam close/limit, maka akan di proses ke esokan harinya.</span>
        </li>
      </ul>
    ),
  },
];

export function SyaratKetentuanContent() {
  return (
    <div className="space-y-3">
      {sections.map((section, i) => {
        const Icon = section.icon;
        return (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 space-y-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon size={18} className={section.color} />
              </div>
              <h2 className={`text-sm font-bold ${section.color}`}>
                {section.title} ⚠️
              </h2>
            </div>
            {section.content}
          </div>
        );
      })}

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <ShieldAlert size={18} className="text-red-500" />
          </div>
          <h2 className="text-sm font-bold text-red-500">
            Status Roamer — Jangan Input ⛔
          </h2>
        </div>
        <div className="text-sm text-foreground/90 leading-relaxed space-y-2">
          <p>Jika status IMEI masih <span className="font-semibold text-red-600 dark:text-red-400">roamer / aktif / belum remove roamer</span>, jangan input untuk Add Roamer.</p>
          <p>Jika tetap memaksa input dalam status roamer/masih aktif, sistem akan <span className="font-semibold">auto remove roamer</span> mengikuti add roamer sebelumnya. <span className="font-semibold text-red-600 dark:text-red-400">Tidak ada refund</span> jika input dalam status roamer/aktif.</p>
          <p>Pastikan status <span className="font-semibold text-emerald-600 dark:text-emerald-400">UNKNOWN</span> jika ingin Add Roamer 3 bulan.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <ShieldAlert size={18} className="text-red-500" />
          </div>
          <h2 className="text-sm font-bold text-red-500">
            Status Registered (Kemenperin/BEACUKAI) — Jangan Input ⛔
          </h2>
        </div>
        <div className="text-sm text-foreground/90 leading-relaxed space-y-2">
          <p>Jika status CEIR adalah <span className="font-semibold text-red-600 dark:text-red-400">Registered</span> (baik Kemenperin maupun BEACUKAI), jangan input karena sinyal tidak akan naik.</p>
          <p><span className="font-semibold text-red-600 dark:text-red-400">Tidak ada refund</span> jika Anda tetap memaksa input dan sinyal tetap tidak naik.</p>
        </div>
      </div>

      <div className="rounded-xl gradient-brand p-5 text-center">
        <p className="text-sm text-white font-medium leading-relaxed">
          Dengan melakukan pemesanan, Anda dianggap telah membaca dan menyetujui semua poin di atas.
        </p>
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <Link to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Kembali
      </Link>

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Syarat & Ketentuan</h1>
        <p className="text-sm text-muted-foreground">
          Harap baca dan pahami semua aturan di bawah ini sebelum melanjutkan pemesanan untuk menghindari kesalahpahaman di kemudian hari.
        </p>
      </div>

      <SyaratKetentuanContent />
    </div>
  );
}
