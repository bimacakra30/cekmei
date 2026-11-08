import { Suspense } from "react";
import { HistoryPage } from "@/components/history/history-page";

export default function RiwayatGsmPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin-slow w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" /></div>}>
      <HistoryPage
        category="GSM"
        title="Riwayat Pesanan GSM"
        subtitle="Layanan GSM — Apple Carrier & SIMLock, Pembuatan Apple ID/iCloud"
        emptyMessage="Belum ada pesanan layanan GSM"
      />
    </Suspense>
  );
}
