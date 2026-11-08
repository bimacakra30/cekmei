import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { StatCard } from "./stat-card";
import { RecentOrdersTable } from "./recent-orders-table";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { getOrders, getOrderStats } from "@/lib/services";
import type { Order } from "@/types";
import { X, Send, Music, ArrowRight } from "lucide-react";
import { setSessionFlag, isSessionFlagActive } from "@/lib/session-flag";
import { useAuth } from "@/hooks/use-auth";

export function DashboardContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user, resellerInfo } = useAuth();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [orderData, statsData] = await Promise.all([
          getOrders(),
          getOrderStats(),
        ]);
        setOrders(orderData);
        setStats(statsData);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!isSessionFlagActive("dashboard_info_modal_shown")) {
      setShowModal(true);
      setSessionFlag("dashboard_info_modal_shown");
    }
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Info Modal */}
      {showModal && createPortal(
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="info-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />

          <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-lg animate-fade-in">
            <div className="flex items-center justify-between p-5 pb-3">
              <h3 id="info-modal-title" className="text-base font-bold text-foreground">Butuh Bantuan?</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 pb-4 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Hubungi admin jika mengalami kendala:
              </p>

              <a
                href="https://t.me/cekbar"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/40 hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 bg-[#0088cc]">
                  <Send size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Telegram</p>
                  <p className="text-xs text-muted-foreground">t.me/cekbar</p>
                </div>
              </a>

              <a
                href="https://www.tiktok.com/@cekbar30"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/40 hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 bg-[#111]">
                  <Music size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">TikTok</p>
                  <p className="text-xs text-muted-foreground">@cekbar30</p>
                </div>
              </a>
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white gradient-brand hover:opacity-90 transition-opacity cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      <section className="rounded-2xl gradient-brand p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Selamat datang kembali!
            </h2>
            <p className="text-sm text-white/65 mt-1.5 max-w-md leading-relaxed">
              Pilih layanan di sidebar untuk memulai pengecekan IMEI.
            </p>
          </div>
          <a
            href="/layanan/cek-imei"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-primary text-sm font-semibold hover:bg-white/90 transition-colors shrink-0"
          >
            Mulai Cek IMEI
            <ArrowRight size={15} />
          </a>
        </div>
      </section>

      {user?.role === "reseller" && resellerInfo && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-3">Info Reseller</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatCard
              icon="Wallet"
              iconColor="#10B981"
              iconBg="#10B98112"
              value={resellerInfo.ceirBalance !== null ? `Rp ${resellerInfo.ceirBalance.toLocaleString("id-ID")}` : "—"}
              label="Saldo CEIR"
            />
            <StatCard
              icon="Users"
              iconColor="#6366F1"
              iconBg="#6366F112"
              value={resellerInfo.activeUsers}
              label="User Aktif"
            />
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Ringkasan Pesanan</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            icon="FileText"
            iconColor="#3B82F6"
            iconBg="#3B82F612"
            value={stats.total}
            label="Total Pesanan"
          />
          <StatCard
            icon="Clock"
            iconColor="#F59E0B"
            iconBg="#F59E0B12"
            value={stats.pending}
            label="Pesanan Pending"
          />
          <StatCard
            icon="XCircle"
            iconColor="#EF4444"
            iconBg="#EF444412"
            value={stats.failed}
            label="Pesanan Gagal"
          />
        </div>
      </section>

      <section>
        <RecentOrdersTable orders={orders} />
      </section>

    </div>
  );
}
