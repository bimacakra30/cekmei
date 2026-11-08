import { Suspense } from "react";
import { HistoryPage } from "@/components/history/history-page";

export default function RiwayatCeirPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin-slow w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" /></div>}>
      <HistoryPage
        category="CEIR"
        title="Riwayat Pesanan CEIR"
        subtitle="Layanan pengecekan IMEI — Check Status, Device History, Validity, Bea Cukai"
        emptyMessage="Belum ada pesanan layanan CEIR"
      />
    </Suspense>
  );
}
