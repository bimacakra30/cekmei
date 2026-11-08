import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronLeft, ChevronRight, Loader2, ExternalLink, X, Eye, AlertCircle } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { statusConfig } from "@/lib/status-config";
import { CeirResultRenderer } from "./ceir-result-renderer";
import { CeirResultsData, OrderResult, isCeirResults, getServiceLabel, StatusCatatan } from "@/lib/ceir-helpers";
import { useOrderHistory } from "@/hooks/use-order-history";
import { Link } from "react-router-dom";
type HistoryOrder = {
  orderId: string;
  serviceId: string;
  serviceName: string;
  groupName: string;
  timeInfo: string;
  imeiList: string[];
  totalPrice: number;
  status: string;
  ceirOrderId: string | null;
  roamerMonths: number | null;
  statusNote: string | null;
  unitPrice: number | null;
  paymentId: string | null;
  paymentType: string | null;
  paymentStatus: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  results: OrderResult[] | CeirResultsData | null;
  isDirectOrder?: boolean;
};


type HistoryPageProps = {
  category: "CEIR" | "GSM" | "UNLOCK_IMEI";
  title: string;
  subtitle: string;
  emptyMessage: string;
  statusOptions?: string[];
};

function DetailModal({ order, onClose }: { order: HistoryOrder; onClose: () => void }) {
  const isRoamer = order.roamerMonths !== null;
  const isPolling = isRoamer && (order.status === "PENDING" || order.status === "PROCESSING");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [currentOrder, setCurrentOrder] = useState(order);

  useEffect(() => {
    if (!isPolling) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${currentOrder.orderId}/refresh-status`);
        if (!res.ok) return;
        const data = await res.json();
        setCurrentOrder(prev => ({
          ...prev,
          status: data.status ?? prev.status,
          statusNote: data.statusNote ?? prev.statusNote,
        }));
        if (data.final && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch { }
    };
    pollRef.current = setInterval(poll, 10_000);
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [isPolling, currentOrder.orderId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const hasCeirResults = currentOrder.results && isCeirResults(currentOrder.results);
  const serviceId = hasCeirResults ? (currentOrder.results as CeirResultsData).service_id : undefined;
  const ceirResult: Record<string, unknown> | unknown[] | undefined = hasCeirResults
    ? (currentOrder.results as CeirResultsData).result as Record<string, unknown> | unknown[] | undefined
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
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{currentOrder.orderId}</p>
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

          <div className="border-b border-border pb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {isRoamer
                ? "Detail Add Roamer"
                : hasCeirResults
                  ? `Hasil Pengecekan ${getServiceLabel(serviceId)}`
                  : "Detail Pesanan"
              }
            </p>
          </div>

          <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Total: {currentOrder.imeiList.length}/{currentOrder.imeiList.length}
            </p>
            {currentOrder.imeiList.map((imei, i) => (
              <p key={i} className="text-sm font-mono text-foreground">
                IMEI: {imei}
              </p>
            ))}
          </div>

          {isRoamer && (
            <div className="bg-card border border-border rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-muted-foreground">{currentOrder.imeiList[0]}</span>
                <span className="text-sm text-muted-foreground">
                  Durasi: <strong className="text-foreground">{currentOrder.roamerMonths} Bulan</strong>
                </span>
              </div>
              {currentOrder.statusNote && (
                <p className={`text-sm font-medium ${
                  currentOrder.status === "SUCCESS" ? "text-emerald-600 dark:text-emerald-400"
                  : currentOrder.status === "FAILED" ? "text-red-500"
                  : "text-muted-foreground"
                }`}>
                  {currentOrder.statusNote}
                </p>
              )}
              {isPolling && (
                <p className="text-xs text-muted-foreground/70 flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Memperbarui status otomatis...
                </p>
              )}
            </div>
          )}

          {!isRoamer && hasCeirResults && (
            <CeirResultRenderer results={currentOrder.results as CeirResultsData} />
          )}

          {serviceId === 30 && ceirResult && (
            <StatusCatatan result={ceirResult as Record<string, string[]>} />
          )}

          {serviceId === 31 && hasCeirResults && (currentOrder.results as CeirResultsData).transaction_id && (
            <div className="rounded-xl px-4 py-3 border-l-4 bg-blue-50 dark:bg-blue-950/20 border-blue-400">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Catatan:</p>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                {`{"provider_transaction_id":"${(currentOrder.results as CeirResultsData).transaction_id}"}`}
              </p>
            </div>
          )}

          {!isRoamer && currentOrder.results && !isCeirResults(currentOrder.results) && Array.isArray(currentOrder.results) && (
            <div className="space-y-1.5">
              {(currentOrder.results as OrderResult[]).map((r, i) => (
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
          )}

          {currentOrder.status === "FAILED" && currentOrder.statusNote && (
            <div className="rounded-xl px-4 py-3 border-l-4 bg-red-50 dark:bg-red-950/20 border-red-400">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Gagal:</p>
              <p className="text-sm text-red-600 dark:text-red-400">{currentOrder.statusNote}</p>
            </div>
          )}

          {currentOrder.status !== "FAILED" && !isRoamer && currentOrder.statusNote && (
            <div className="flex gap-3 p-3.5 bg-amber-500/5 border border-amber-500/15 rounded-lg">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-0.5">Catatan</p>
                <p className="text-sm text-foreground leading-relaxed">{currentOrder.statusNote}</p>
              </div>
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

function OrderRow({ order: initialOrder, onViewDetail }: { order: HistoryOrder; onViewDetail: (order: HistoryOrder) => void }) {
  const [order] = useState(initialOrder);
  const sc = statusConfig[order.status] ?? { label: order.status, pill: "bg-gray-500/10 text-gray-500", dot: "bg-gray-400" };
  const hasResults = (order.results !== null && (
    isCeirResults(order.results)
      ? order.results.result !== undefined || order.results.error !== undefined
      : Array.isArray(order.results) && order.results.length > 0
  )) || order.roamerMonths !== null;

  return (
    <tr className="border-b border-border hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono font-medium text-foreground">{order.orderId}</span>
          {order.isDirectOrder && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Direct
            </span>
          )}
          {order.status === "PENDING_PAYMENT" && order.paymentId && (
            <Link to={`/pembayaran/${order.paymentId}`}
              className="text-blue-500 hover:text-blue-600"
            >
              <ExternalLink size={11} />
            </Link>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(order.createdAt)}</p>
      </td>

      <td className="px-4 py-3.5">
        <p className="text-sm text-foreground font-medium">{order.serviceName}</p>
        {order.timeInfo && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{order.timeInfo}</p>
        )}
      </td>

      <td className="px-4 py-3.5">
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {order.imeiList.slice(0, 2).map((imei, i) => (
            <span key={i} className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {imei}
            </span>
          ))}
          {order.imeiList.length > 2 && (
            <span className="text-[10px] text-muted-foreground px-1 py-0.5">
              +{order.imeiList.length - 2} lainnya
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3.5 text-right">
        <span className="text-sm font-semibold text-foreground">{formatRupiah(order.totalPrice)}</span>
        {order.paymentType && (
          <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
            {order.paymentType.replace(/_/g, " ")}
          </p>
        )}
      </td>

      <td className="px-4 py-3.5 text-center">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.pill}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} aria-hidden="true" />
          {sc.label}
        </span>
      </td>

      <td className="px-4 py-3.5 text-center">
        {hasResults ? (
          <button
            onClick={() => onViewDetail(order)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Eye size={12} />
            Lihat
          </button>
        ) : (
          <span className="text-[10px] text-muted-foreground/40">—</span>
        )}
      </td>
    </tr>
  );
}

function MobileOrderCard({ order: initialOrder, onViewDetail }: { order: HistoryOrder; onViewDetail: (order: HistoryOrder) => void }) {
  const [order] = useState(initialOrder);
  const sc = statusConfig[order.status] ?? { label: order.status, pill: "bg-gray-500/10 text-gray-500", dot: "bg-gray-400" };
  const hasResults = (order.results !== null && (
    isCeirResults(order.results)
      ? order.results.result !== undefined || order.results.error !== undefined
      : Array.isArray(order.results) && order.results.length > 0
  )) || order.roamerMonths !== null;

  return (
    <div className="border border-border rounded-xl p-4 space-y-3 bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 truncate">
            {order.orderId}
            {order.isDirectOrder && (
              <span className="ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Direct
              </span>
            )}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.pill}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} aria-hidden="true" />
          {sc.label}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-xs">Layanan:</span>
          <span className="font-medium text-foreground text-xs text-right">{order.serviceName}</span>
        </div>
        <div className="flex justify-between items-start">
          <span className="text-muted-foreground text-xs shrink-0">IMEI:</span>
          <div className="flex flex-wrap gap-1 justify-end ml-2">
            {order.imeiList.slice(0, 2).map((imei, i) => (
              <span key={i} className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                {imei}
              </span>
            ))}
            {order.imeiList.length > 2 && (
              <span className="text-[10px] text-muted-foreground">+{order.imeiList.length - 2}</span>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-xs">Harga:</span>
          <span className="font-bold text-foreground text-xs">{formatRupiah(order.totalPrice)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        {hasResults ? (
          <button
            onClick={() => onViewDetail(order)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Eye size={13} />
            Lihat Detail
          </button>
        ) : order.status === "PENDING_PAYMENT" && order.paymentId ? (
          <Link to={`/pembayaran/${order.paymentId}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            <ExternalLink size={13} />
            Bayar Sekarang
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function OrderList({ orders, loading, emptyMessage, search, statusFilter, onViewDetail }: {
  orders: HistoryOrder[];
  loading: boolean;
  emptyMessage: string;
  search: string;
  statusFilter: string;
  onViewDetail: (order: HistoryOrder) => void;
}) {
  if (loading) {
    return (
      <div className="py-14 text-center">
        <Loader2 size={24} className="animate-spin mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Memuat riwayat...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-14 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {search || statusFilter ? "Coba ubah filter pencarian" : "Pesanan akan muncul di sini setelah Anda melakukan order"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden space-y-3 p-3">
        {orders.map((order) => (
          <MobileOrderCard key={order.orderId} order={order} onViewDetail={onViewDetail} />
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <caption className="sr-only">Riwayat pesanan</caption>
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Order ID</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Layanan</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">IMEI</th>
              <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Biaya</th>
              <th className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Status</th>
              <th className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <OrderRow key={order.orderId} order={order} onViewDetail={onViewDetail} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function HistoryPage({ category, title, subtitle, emptyMessage, statusOptions }: HistoryPageProps) {
  const {
    orders, pagination, loading, search, setSearch,
    statusFilter, setStatusFilter, page, setPage,
    selectedOrder, setSelectedOrder, handleCloseDetail, allStatuses,
  } = useOrderHistory<HistoryOrder>({ category, statusOptions });

  return (
    <div className="space-y-4 animate-fade-in">

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari Order ID atau nama layanan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        >
          <option value="">Semua Status</option>
          {allStatuses.map((s) => (
            <option key={s} value={s}>{statusConfig[s]?.label ?? s}</option>
          ))}
        </select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {loading ? "..." : `${pagination.total} pesanan`}
          </span>
        </div>

        <OrderList
          orders={orders}
          loading={loading}
          emptyMessage={emptyMessage}
          search={search}
          statusFilter={statusFilter}
          onViewDetail={setSelectedOrder}
        />

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

      {selectedOrder && (
        <DetailModal order={selectedOrder} onClose={handleCloseDetail} />
      )}
    </div>
  );
}
