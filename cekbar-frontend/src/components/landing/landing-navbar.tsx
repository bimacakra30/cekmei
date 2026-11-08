import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { CekbarIcon, CekbarWordmark } from "@/components/ui/cekbar-logo";
import { useScrollProgress } from "./landing-hooks";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const progress = useScrollProgress();

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const navLinks = [
    { label: "Beranda", href: "/" },
    { label: "Layanan", href: "#layanan" },
    { label: "Cara Kerja", href: "#cara-kerja" },
    { label: "Kontak", href: "#kontak" },
  ];

  return (
    <>
      <div className="lp-progress" style={{ width: `${progress}%` }} />
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-blue-100/60 shadow-lg shadow-blue-900/5"
          : "bg-transparent"
          }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex h-16 sm:h-[72px] items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <CekbarIcon size={36} className="transition-transform duration-200 group-hover:scale-105 group-hover:rotate-[-4deg]" />
              <CekbarWordmark variant={scrolled ? "light" : "dark"} size="md" />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`px-4 py-2 text-[13.5px] font-medium rounded-lg transition-colors ${scrolled
                    ? "text-slate-600 hover:text-blue-700 hover:bg-blue-50"
                    : "text-blue-100 hover:text-white hover:bg-white/10"
                    }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/login"
                className={`px-4 py-2 text-[13.5px] font-semibold rounded-lg transition-colors ${scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"
                  }`}
              >
                Masuk
              </Link>
              <Link to="/register"
                className="px-5 py-2.5 text-[13.5px] font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg shadow-blue-600/25 transition-all duration-200 hover:from-blue-500 hover:to-blue-600 active:scale-[0.97]"
              >
                Daftar Akun
              </Link>
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"}`}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-blue-100 shadow-xl">
            <div className="px-5 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-slate-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <Link to="/login" className="block w-full px-4 py-3 text-sm font-semibold text-center text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                  Masuk
                </Link>
                <Link to="/register" className="block w-full px-4 py-3 text-sm font-semibold text-center text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg transition-colors">
                  Daftar Akun
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
