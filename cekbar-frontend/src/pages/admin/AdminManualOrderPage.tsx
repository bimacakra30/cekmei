import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Search, Loader2, RefreshCw, Eye, Play, CheckCircle2, XCircle,
  Clock, ChevronLeft, ChevronRight, Copy, Check, X,
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { statusConfig } from "@/lib/status-config";

type ManualOrder = {
  orderId: string;
  serviceId: string;
  serviceName: string;
  imeiList: string[];
  totalPrice: number;
  orderStatus: string;
  statusNote: string | null;
  adminNote: string | null;
  processedBy: number | null;
  processedAt: string | null;
  isDirectOrder: boolean;
  paymentId: string | null;
  paymentStatus: string | null;
  totalAmount: number | null;
  confirmedAt: string | null;
  paymentType: string | null;
  username: string;
  email: string;
  nama: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type StatusTab = {
  key: string;
  label: string;
  icon: typeof Clock;
  activeClass: string;
};

const TABS: StatusTab[] = [
  { key: "ALL", label: "Semua", icon: Search, activeClass: "border-foreground text-foreground" },
  { key: "PENDING", label: "Pending", icon: Clock, activeClass: "border-amber-500 text-amber-600 dark:text-amber-400" },
  { key: "PROCESSING", label: "Diproses", icon: Loader2, activeClass: "border-blue-500 text-blue-600 dark:text-blue-400" },
  { key: "SUCCESS", label: "Selesai", icon: CheckCircle2, activeClass: "border-emerald-500 text-emerald-600 dark:text-emerald-400" },
  { key: "FAILED", label: "Gagal", icon: XCircle, activeClass: "border-red-500 text-red-600 dark:text-red-400" },
];

export default function AdminPesananManualPage() {
  const [orders, setOrders] = useState<ManualOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [selectedOrder, setSelectedOrder] = useState<ManualOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("status", activeTab);
      if (search) params.set("search", search);
      params.set("page", String(page));

      const res = await fetch(`/api/admin/orders/manual?${params}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
        setPagination(data.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 1 });
        setStatusCounts(data.statusCounts ?? {});
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Auto-refresh setiap 30 detik
  useEffect(() => {
    const interval = setInterval(fetchOrders, 30_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => { setPage(1); }, [activeTab, search]);

  const totalAll = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  function getTabCount(key: string): number {
    if (key === "ALL") return totalAll;
    return statusCounts[key] ?? 0;
  }

  return (
    <div className="space-y-5 animate-fade-in">

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const count = getTabCount(tab.key);
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border-b-2 transition-colors whitespace-nowrap",
                isActive
                  ? tab.activeClass + " bg-card border-current"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
              )}
            >
              <TabIcon size={14} />
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                  isActive
                    ? "bg-current/10"
                    : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 py-3 border-b border-border">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari order ID, username, email, layanan..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            {search ? "Tidak ada order ditemukan" : "Belum ada order manual"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <caption className="sr-only">Daftar pesanan manual</caption>
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Order</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">User</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3 hidden md:table-cell">Layanan</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3 hidden lg:table-cell">IMEI</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Total</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => {
                  const os = statusConfig[order.orderStatus] ?? statusConfig.PENDING;
                  return (
                    <tr key={order.orderId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono font-medium text-foreground">{order.orderId}</span>
                        <span className="block text-[11px] text-muted-foreground mt-0.5">{formatDate(order.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-medium text-foreground">{order.username}</span>
                        <span className="block text-[11px] text-muted-foreground">{order.email}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-foreground">{order.serviceName}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <div className="flex flex-col gap-0.5">
                          {order.imeiList.slice(0, 2).map((imei, i) => (
                            <span key={i} className="text-[11px] font-mono text-muted-foreground">{imei}</span>
                          ))}
                          {order.imeiList.length > 2 && (
                            <span className="text-[10px] text-muted-foreground/60">+{order.imeiList.length - 2} lainnya</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold text-foreground">{formatRupiah(order.totalAmount ?? order.totalPrice)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border", os.pill)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", os.dot)} aria-hidden="true" />
                          {os.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Detail"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-xs font-medium text-foreground bg-muted rounded-lg">{page}</span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && typeof document !== "undefined" && (
        <ManualDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdated={() => { setSelectedOrder(null); fetchOrders(); }}
        />
      )}
    </div>
  );
}

function ManualDetailModal({
  order,
  onClose,
  onUpdated,
}: {
  order: ManualOrder;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState(order.adminNote ?? "");
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleAction = async (action: string) => {
    setProcessing(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.orderId}/process`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, admin_note: adminNote || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error ?? "Gagal memproses");
        return;
      }

      onUpdated();
    } catch {
      setActionError("Terjadi kesalahan");
    } finally {
      setProcessing(false);
      setConfirmAction(null);
    }
  };

  const os = statusConfig[order.orderStatus] ?? statusConfig.PENDING;
  const canProcess = order.orderStatus === "PENDING";
  const canComplete = order.orderStatus === "PROCESSING";
  const canFail = order.orderStatus === "PENDING" || order.orderStatus === "PROCESSING";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-border px-6 py-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Detail Pesanan Manual</h3>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{order.orderId}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Informasi Pemesan</p>
            <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 space-y-2 text-sm">
              <DetailRow label="User" value={`${order.username} (${order.nama})`} />
              <DetailRow label="Email" value={order.email} />
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Informasi Order</p>
            <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 space-y-2 text-sm">
              <DetailRow label="Order ID" value={order.orderId} mono />
              <DetailRow label="Layanan" value={order.serviceName} />
              <DetailRow label="Total" value={formatRupiah(order.totalAmount ?? order.totalPrice)} className="font-bold text-blue-600 dark:text-blue-400" />
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Status</span>
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border", os.pill)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", os.dot)} aria-hidden="true" />
                  {os.label}
                </span>
              </div>
              <DetailRow label="Tanggal Order" value={formatDate(order.createdAt)} />
              {order.confirmedAt && (
                <DetailRow label="Dibayar Pada" value={formatDate(order.confirmedAt)} />
              )}
              {order.completedAt && (
                <DetailRow label="Selesai Pada" value={formatDate(order.completedAt)} />
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              IMEI ({order.imeiList.length})
            </p>
            <div className="bg-muted/30 border border-border rounded-xl px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                {order.imeiList.map((imei, i) => (
                  <ImeiChip key={i} imei={imei} />
                ))}
              </div>
            </div>
          </div>

          {order.statusNote && (
            <div className="rounded-xl px-4 py-3 border-l-4 bg-amber-50 dark:bg-amber-950/20 border-amber-400">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Status Note</p>
              <p className="text-sm text-foreground">{order.statusNote}</p>
            </div>
          )}

          {(canProcess || canComplete || canFail) && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Aksi Admin</p>

              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Catatan admin (opsional, misal: 'IMEI sudah di-unblock, restart HP')"
                rows={2}
                className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
              />

              {actionError && (
                <div className="flex items-start gap-2 px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-500">{actionError}</p>
                </div>
              )}

              {confirmAction ? (
                <div className="flex items-center gap-2 p-3 bg-muted/50 border border-border rounded-xl">
                  <p className="text-sm text-foreground flex-1">
                    Yakin {confirmAction === "PROCESSING" ? "mulai proses" : confirmAction === "SUCCESS" ? "tandai selesai" : "tandai gagal"} order ini?
                  </p>
                  <button
                    onClick={() => handleAction(confirmAction)}
                    disabled={processing}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {processing ? <Loader2 size={12} className="animate-spin" /> : "Ya"}
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    disabled={processing}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {canProcess && (
                    <button
                      onClick={() => setConfirmAction("PROCESSING")}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      <Play size={14} />
                      Mulai Proses
                    </button>
                  )}
                  {canComplete && (
                    <button
                      onClick={() => setConfirmAction("SUCCESS")}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                      <CheckCircle2 size={14} />
                      Tandai Selesai
                    </button>
                  )}
                  {canFail && (
                    <button
                      onClick={() => setConfirmAction("FAILED")}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <XCircle size={14} />
                      Tandai Gagal
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {order.adminNote && order.orderStatus !== "PENDING" && order.orderStatus !== "PROCESSING" && (
            <div className="rounded-xl px-4 py-3 border-l-4 bg-blue-50 dark:bg-blue-950/20 border-blue-400">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Catatan Admin</p>
              <p className="text-sm text-foreground">{order.adminNote}</p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ImeiChip({ imei }: { imei: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-[11px] font-mono px-2 py-1 rounded-md">
      {imei}
      <button
        onClick={() => { navigator.clipboard.writeText(imei); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="p-0.5 rounded hover:bg-background transition-colors"
        title="Copy"
      >
        {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
      </button>
    </div>
  );
}

function DetailRow({ label, value, mono, className }: { label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-right", mono && "font-mono text-xs", className)}>{value}</span>
    </div>
  );
}

