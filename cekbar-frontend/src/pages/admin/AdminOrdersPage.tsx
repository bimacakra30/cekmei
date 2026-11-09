import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, Loader2, RefreshCw, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { statusConfig } from "@/lib/status-config";
import { CeirResultRenderer } from "@/components/history/ceir-result-renderer";
import { CeirResultsData, isCeirResults, getServiceLabel, StatusCatatan } from "@/lib/ceir-helpers";

type AdminOrder = {
  orderId: string;
  serviceName: string;
  imeiList: string[];
  totalPrice: number;
  orderStatus: string;
  ceirOrderId: string | null;
  statusNote: string | null;
  roamerMonths: number | null;
  results: unknown;
  paymentId: string | null;
  paymentStatus: string | null;
  totalAmount: number;
  username: string;
  email: string;
  nama: string;
  confirmedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};


const paymentStatusConfig: Record<string, { label: string; dot: string; pill: string }> = {
  MENUNGGU: { label: "Belum Bayar", dot: "bg-amber-400", pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40" },
  LUNAS: { label: "Lunas", dot: "bg-emerald-400", pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40" },
  KADALUARSA: { label: "Kadaluarsa", dot: "bg-red-400", pill: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40" },
  GAGAL: { label: "Gagal", dot: "bg-red-400", pill: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40" },
};

export default function AdminPesananPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterOrderStatus, setFilterOrderStatus] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [stats, setStats] = useState({ total: 0, success: 0, pending: 0, failed: 0 });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterOrderStatus !== "ALL") params.set("orderStatus", filterOrderStatus);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(perPage));
      const res = await fetch(`/api/admin/orders?${params}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
        setPagination(data.pagination ?? { total: 0, page: 1, limit: perPage, totalPages: 1 });
        if (data.stats) setStats(data.stats);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [filterOrderStatus, search, page, perPage]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [filterOrderStatus, search, perPage]);

  return (
    <div className="space-y-5 animate-fade-in">

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Order", value: stats.total, color: "text-foreground" },
          { label: "Selesai", value: stats.success, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Pending/Proses", value: stats.pending, color: "text-blue-600 dark:text-blue-400" },
          { label: "Gagal", value: stats.failed, color: "text-red-600 dark:text-red-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-border px-4 py-3 text-center">
            <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 py-3 border-b border-border">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari order ID, username, CEIR ID..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <select
            value={filterOrderStatus}
            onChange={(e) => setFilterOrderStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING_PAYMENT">Belum Bayar</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Diproses</option>
            <option value="SUCCESS">Selesai</option>
            <option value="FAILED">Gagal</option>
            <option value="EXPIRED">Expired</option>
          </select>
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
            Tidak ada order ditemukan
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <caption className="sr-only">Daftar semua pesanan</caption>
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Order</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">User</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3 hidden md:table-cell">Layanan</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Total</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Order</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Bayar</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => {
                  const os = statusConfig[order.orderStatus] ?? statusConfig.PENDING;
                  const ps = order.paymentStatus ? (paymentStatusConfig[order.paymentStatus] ?? paymentStatusConfig.MENUNGGU) : null;

                  return (
                    <tr key={order.orderId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono font-medium text-foreground">{order.orderId}</span>
                        {order.ceirOrderId && (
                          <span className="block text-[10px] font-mono text-blue-500 mt-0.5">{order.ceirOrderId}</span>
                        )}
                        <span className="block text-[11px] text-muted-foreground mt-0.5">{formatDate(order.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-medium text-foreground">{order.username}</span>
                        <span className="block text-[11px] text-muted-foreground">{order.email}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-foreground">{order.serviceName}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {order.imeiList?.length ?? 0} IMEI
                          {order.roamerMonths && ` · ${order.roamerMonths} Bulan`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold text-foreground">{formatRupiah(order.totalAmount || order.totalPrice)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border", os.pill)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", os.dot)} aria-hidden="true" />
                          {os.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {ps ? (
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border", ps.pill)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", ps.dot)} aria-hidden="true" />
                            {ps.label}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="Detail"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Tampilkan</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="bg-card border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>per halaman</span>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} className="text-muted-foreground" />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (pagination.totalPages <= 7) return true;
                  if (p === 1 || p === pagination.totalPages) return true;
                  if (Math.abs(p - page) <= 1) return true;
                  return false;
                })
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "..." ? (
                    <span key={`dots-${idx}`} className="px-1 text-muted-foreground text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                        page === p
                          ? "gradient-brand text-white"
                          : "border border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            </div>
          )}

          <span className="text-xs text-muted-foreground">
            Halaman {pagination.page} dari {pagination.totalPages}
          </span>
        </div>
      )}

      {selectedOrder && typeof document !== "undefined" && (
        <AdminDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}

function AdminDetailModal({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const isRoamer = order.roamerMonths !== null;
  const hasCeirResults = order.results && isCeirResults(order.results);
  const serviceId = hasCeirResults ? (order.results as CeirResultsData).service_id : undefined;
  const ceirResult: Record<string, unknown> | unknown[] | undefined = hasCeirResults
    ? (order.results as CeirResultsData).result as Record<string, unknown> | unknown[] | undefined
    : undefined;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-border px-6 py-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Detail Order</h3>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{order.orderId}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            ✕
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
              {order.ceirOrderId && (
                <DetailRow label="CEIR Order ID" value={order.ceirOrderId} mono className="text-blue-500" />
              )}
              <DetailRow label="Layanan" value={order.serviceName} />
              {order.roamerMonths && (
                <DetailRow label="Durasi Roamer" value={`${order.roamerMonths} Bulan`} />
              )}
              <DetailRow label="Total Bayar" value={formatRupiah(order.totalAmount || order.totalPrice)} className="font-bold text-blue-600 dark:text-blue-400" />
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Status Order</span>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                  (statusConfig[order.orderStatus] ?? statusConfig.PENDING).pill
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", (statusConfig[order.orderStatus] ?? statusConfig.PENDING).dot)} aria-hidden="true" />
                  {(statusConfig[order.orderStatus] ?? statusConfig.PENDING).label}
                </span>
              </div>
              {order.paymentStatus && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Status Bayar</span>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                    (paymentStatusConfig[order.paymentStatus] ?? paymentStatusConfig.MENUNGGU).pill
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", (paymentStatusConfig[order.paymentStatus] ?? paymentStatusConfig.MENUNGGU).dot)} aria-hidden="true" />
                    {(paymentStatusConfig[order.paymentStatus] ?? paymentStatusConfig.MENUNGGU).label}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Waktu</p>
            <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 space-y-2 text-sm">
              <DetailRow label="Tanggal Order" value={formatDate(order.createdAt)} />
              {order.confirmedAt && (
                <DetailRow label="Dibayar Pada" value={formatDate(order.confirmedAt)} />
              )}
              {order.completedAt && (
                <DetailRow label="Selesai Pada" value={formatDate(order.completedAt)} />
              )}
            </div>
          </div>

          <div className="border-b border-border pb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {isRoamer
                ? "Detail Add Roamer"
                : hasCeirResults
                  ? `Hasil Pengecekan ${getServiceLabel(serviceId)}`
                  : "Hasil Pesanan"
              }
            </p>
          </div>

          <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Total: {order.imeiList?.length ?? 0}/{order.imeiList?.length ?? 0}
            </p>
            {order.imeiList?.map((imei, i) => (
              <p key={i} className="text-sm font-mono text-foreground">
                IMEI: {imei}
              </p>
            ))}
          </div>

          {isRoamer && (
            <div className="bg-card border border-border rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-muted-foreground">{order.imeiList?.[0]}</span>
                <span className="text-sm text-muted-foreground">
                  Durasi: <strong className="text-foreground">{order.roamerMonths} Bulan</strong>
                </span>
              </div>
              {order.statusNote && (
                <p className={`text-sm font-medium ${
                  order.orderStatus === "SUCCESS" ? "text-emerald-600 dark:text-emerald-400"
                  : order.orderStatus === "FAILED" ? "text-red-500"
                  : "text-muted-foreground"
                }`}>
                  {order.statusNote}
                </p>
              )}
            </div>
          )}

          {!isRoamer && hasCeirResults ? (
            <CeirResultRenderer results={order.results as CeirResultsData} />
          ) : null}

          {serviceId === 30 && ceirResult && (
            <StatusCatatan result={ceirResult as Record<string, string[]>} />
          )}

          {serviceId === 31 && hasCeirResults && (order.results as CeirResultsData).transaction_id ? (
            <div className="rounded-xl px-4 py-3 border-l-4 bg-blue-50 dark:bg-blue-950/20 border-blue-400">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Catatan:</p>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                {`{"provider_transaction_id":"${(order.results as CeirResultsData).transaction_id}"}`}
              </p>
            </div>
          ) : null}

          {!isRoamer && order.results && !isCeirResults(order.results) && Array.isArray(order.results) ? (
            <div className="space-y-1.5">
              {(order.results as { imei?: string; status?: string; detail?: string }[]).map((r, i) => (
                <div key={i} className="flex items-start gap-3 bg-card border border-border rounded-lg px-3 py-2.5">
                  <span className="text-[11px] font-mono text-muted-foreground shrink-0">{r.imei ?? `#${i + 1}`}</span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[11px] font-semibold mr-2 ${
                      r.status?.toLowerCase().includes("gagal") || r.status?.toLowerCase().includes("blocked") || r.status?.toLowerCase().includes("invalid")
                        ? "text-red-500"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}>{r.status}</span>
                    <span className="text-[11px] text-muted-foreground">{r.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {order.orderStatus === "FAILED" && order.statusNote && (
            <div className="rounded-xl px-4 py-3 border-l-4 bg-red-50 dark:bg-red-950/20 border-red-400">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Gagal:</p>
              <p className="text-sm text-red-600 dark:text-red-400">{order.statusNote}</p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border px-6 py-4 flex items-center justify-end gap-3">
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

function DetailRow({ label, value, mono, className }: { label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-right", mono && "font-mono text-xs", className)}>{value}</span>
    </div>
  );
}
