import { Link } from "react-router-dom";
import { CekbarLogo } from "@/components/ui/cekbar-logo";
import { useReveal } from "./landing-hooks";

export function Footer() {
  const { ref, visible } = useReveal(0.1);

  return (
    <footer id="footer" className="border-t border-blue-100"
      style={{ background: "linear-gradient(180deg, #eff6ff 0%, #dbeafe 60%, #eff6ff 100%)" }}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12 sm:py-16">
        <div
          ref={ref}
          className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <CekbarLogo variant="light" size="sm" />
            </div>
            <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
              Platform verifikasi IMEI terpercaya. Pastikan perangkat Anda asli, legal, dan aman sebelum membeli.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-4">Layanan</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              {[
                "Check IMEI Status",
                "Apple Carrier Check",
                "Check IMEI Bea Cukai",
                "Cek Validity Roamer",
              ].map((label) => (
                <li key={label}>
                  <Link to="/dashboard" className="hover:text-blue-600 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><Link to="/login" className="hover:text-blue-600 transition-colors">Masuk</Link></li>
              <li><Link to="/register" className="hover:text-blue-600 transition-colors">Daftar Akun</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-4">Informasi</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><span className="hover:text-blue-600 transition-colors cursor-default">Cara Baca Hasil</span></li>
              <li><span className="hover:text-blue-600 transition-colors cursor-default">FAQ</span></li>
              <li><Link to="#kontak" className="hover:text-blue-600 transition-colors">Hubungi Kami</Link></li>
            </ul>
          </div>
        </div>

        <div className={`mt-12 pt-8 border-t border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-700 delay-200 ${visible ? "opacity-100" : "opacity-0"}`}>
          <p className="text-sm text-slate-400">&copy; {new Date().getFullYear()} Cekbar. Semua hak dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
