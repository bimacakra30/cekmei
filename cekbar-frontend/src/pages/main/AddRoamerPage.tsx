import { Suspense } from "react";
import { RoamerHistoryPage } from "@/components/history/roamer-history-page";

export default function RiwayatAddRoamerPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Memuat...</div>}>
      <RoamerHistoryPage
        category="UNLOCK_IMEI"
        title="Riwayat Pesanan Roamer"
        subtitle="Semua pesanan Add Roamer 1/3 Bulan"
        emptyMessage="Anda belum memiliki riwayat pesanan Roamer."
      />
    </Suspense>
  );
}
