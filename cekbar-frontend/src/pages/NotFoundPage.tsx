import { Link } from "react-router-dom";
export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-6">
        <h1 className="text-7xl font-bold gradient-brand-text mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <Link to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium gradient-brand hover:opacity-90 transition-opacity"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
