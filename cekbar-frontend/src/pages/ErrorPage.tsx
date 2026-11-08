import { Link } from "react-router-dom";

export default function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold text-foreground">Terjadi Kesalahan</h1>
      <p className="text-muted-foreground">Maaf, terjadi kesalahan yang tidak terduga.</p>
      <Link
        to="/"
        className="px-4 py-2 rounded-lg bg-brand-primary text-white hover:opacity-90 transition"
      >
        Kembali ke beranda
      </Link>
    </div>
  );
}
