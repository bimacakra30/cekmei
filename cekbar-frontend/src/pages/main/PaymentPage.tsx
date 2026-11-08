import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock,
  Copy,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  QrCode,
  Timer,
  RotateCcw,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { CekbarIcon } from "@/components/ui/cekbar-logo";
import { cn } from "@/lib/utils";
import { formatRupiah, formatDate } from "@/lib/utils";
import type { PaymentStatus } from "@/types";

type PaymentData = {
  paymentId: string;
  orderId: string;
  serviceName: string;
  amount: number;
  fee: number;
  totalAmount: number;
  status: PaymentStatus;
  createdAt: string;
  expiresAt?: string;
  confirmedAt?: string;
  qrisId: string;
  trxId: string;
  qrImage: string;
  qrisUrl: string;
  gopayTransactionId: string;
  payerIssuer: string;
  paymentType: string;
  gopayApiUrl: string;
};

export default function PaymentPage() {
  const params = useParams();
  const navigate = useNavigate();
  const paymentId = params.paymentId as string;

  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);
  const sseRef = useRef<EventSource | null>(null);

  function getHistoryPath(serviceName?: string): string {
    if (!serviceName) return "/riwayat/pesanan-ceir";
    const lower = serviceName.toLowerCase();
    if (lower.includes("roamer") || lower.includes("unlock") || lower.includes("unblock") || lower.includes("bulan")) {
      return "/riwayat/add-roamer";
    }
    if (lower.includes("carrier") || lower.includes("simlock") || lower.includes("apple") || lower.includes("icloud") || lower.includes("gsm")) {
      return "/riwayat/pesanan-gsm";
    }
    return "/riwayat/pesanan-ceir";
  }

  const fetchPayment = useCallback(async () => {
    try {
      const res = await fetch(`/api/payments/${paymentId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setPayment(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  const syncAndFetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/payments/${paymentId}/sync`, {
        method: "POST",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.synced && data.status === "LUNAS") {
          const payRes = await fetch(`/api/payments/${paymentId}`, { cache: "no-store" });
          if (payRes.ok) {
            const payData = await payRes.json();
            setPayment(payData);
          }
          return;
        }
      }
    } catch {
    }
    await fetchPayment();
  }, [paymentId, fetchPayment]);

  useEffect(() => {
    syncAndFetch();
  }, [syncAndFetch]);

  useEffect(() => {
    if (!payment || payment.status !== "LUNAS") return;

    const historyPath = getHistoryPath(payment.serviceName);
    const orderId = payment.orderId || (payment as Record<string, unknown>).order_id;
    const target = orderId ? `${historyPath}?open=${orderId}` : historyPath;

    const timer = setTimeout(() => {
      navigate(target);
    }, 3000);

    return () => clearTimeout(timer);
  }, [payment, navigate]);

  useEffect(() => {
    if (!payment || payment.status !== "MENUNGGU" || !payment.qrisId) return;

    if (sseRef.current) {
      sseRef.current.close();
    }

    const evtSource = new EventSource(`/api/payments/${paymentId}/sse`);
    sseRef.current = evtSource;

    evtSource.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data);
        if (data.paid && data.status === "PAID") {
          evtSource.close();
          sseRef.current = null;
          syncAndFetch();
        }
      } catch {
      }
    };

    evtSource.onerror = function () {
      evtSource.close();
      sseRef.current = null;
    };

    return () => {
      evtSource.close();
      sseRef.current = null;
    };
  }, [payment?.qrisId, payment?.status, paymentId, syncAndFetch]);

  const paymentStatus = payment?.status;

  useEffect(() => {
    if (!paymentStatus || paymentStatus !== "MENUNGGU") return;

    const interval = setInterval(syncAndFetch, 5000);
    return () => clearInterval(interval);
  }, [paymentStatus, syncAndFetch]);

  const paymentExpiresAt = payment?.expiresAt;

  useEffect(() => {
    if (!paymentStatus || paymentStatus !== "MENUNGGU" || !paymentExpiresAt) return;

    const tick = () => {
      const now = Date.now();
      const expires = new Date(paymentExpiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setCountdown("00:00");
        setIsExpired(true);
        fetchPayment();
        return;
      }

      setIsExpired(false);
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [paymentStatus, paymentExpiresAt, fetchPayment]);

  const handleCopy = useCallback(async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <Loader2 size={32} className="animate-spin text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Memuat data pembayaran...</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <XCircle size={40} className="text-red-400 mx-auto mb-3" />
        <p className="font-semibold text-foreground">Pembayaran tidak ditemukan</p>
        <p className="text-sm text-muted-foreground mt-1">ID tidak valid atau sudah kadaluarsa.</p>
      </div>
    );
  }

  const isWaiting = payment.status === "MENUNGGU";
  const isPaid = payment.status === "LUNAS";
  const isFailed = payment.status === "KADALUARSA" || payment.status === "GAGAL";

  return (
    <div className="max-w-lg mx-auto animate-fade-in space-y-4">

      {isPaid && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
          <CheckCircle2 size={22} className="text-emerald-500 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-300">Pembayaran Berhasil!</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">Order Anda sedang diproses</p>
          </div>
        </div>
      )}
      {isFailed && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800">
          <XCircle size={22} className="text-red-500 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">
              {payment.status === "KADALUARSA" ? "Pembayaran Kadaluarsa" : "Pembayaran Gagal"}
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">Silakan buat order baru</p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border overflow-hidden">

        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pembayaran</p>
              <h2 className="text-lg font-bold text-foreground">{payment.serviceName}</h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{payment.orderId}</p>
            </div>
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
              isWaiting && "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
              isPaid && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
              isFailed && "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
            )}>
              {isWaiting && <Clock size={12} />}
              {isPaid && <CheckCircle2 size={12} />}
              {isFailed && <XCircle size={12} />}
              {isWaiting ? "Menunggu" : isPaid ? "Lunas" : "Gagal"}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-2.5 border-b border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Harga Layanan</span>
            <span className="font-medium text-foreground">{formatRupiah(payment.amount)}</span>
          </div>
          {payment.fee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Kode Unik</span>
              <span className="text-muted-foreground">{formatRupiah(payment.fee)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="font-bold text-foreground">Total Bayar</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">{formatRupiah(payment.totalAmount)}</span>
              <button
                onClick={() => handleCopy(payment.totalAmount.toString(), "total")}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                title="Salin nominal"
              >
                {copiedField === "total"
                  ? <CheckCircle2 size={14} className="text-emerald-500" />
                  : <Copy size={14} className="text-muted-foreground" />
                }
              </button>
            </div>
          </div>
        </div>

        {isWaiting && (
          <div className="px-6 py-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4">
              <QrCode size={16} className="text-blue-500" />
              <p className="text-sm font-semibold text-foreground">Scan QRIS untuk Membayar</p>
            </div>

            {payment.qrImage ? (
              <div className="relative p-4 bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
                <img                   src={payment.qrImage}
                  alt="Scan QRIS untuk bayar"
                  width={256}
                  height={256}
                  className="w-64 h-64 object-contain"
                 
                />
                <div className="absolute inset-x-4 top-4 bottom-4 overflow-hidden rounded-xl pointer-events-none">
                  <div className="h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-qris-scan" />
                </div>
              </div>
            ) : (
              <div className="w-64 h-64 bg-muted rounded-2xl flex items-center justify-center mb-4">
                <div className="text-center">
                  <Loader2 size={24} className="animate-spin text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Membuat QRIS...</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 mb-4 w-full">
              <Smartphone size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1.5">
                <p className="font-semibold">Cara Membayar:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-blue-600 dark:text-blue-400">
                  <li>Buka aplikasi <strong>GoPay, DANA, OVO, ShopeePay</strong>, atau e-wallet lainnya</li>
                  <li>Pilih <strong>Scan QR</strong> atau <strong>Bayar dengan QRIS</strong></li>
                  <li>Arahkan kamera ke QR di atas</li>
                  <li>Konfirmasi pembayaran di aplikasi</li>
                </ol>
              </div>
            </div>

            {payment.qrisUrl && (
              <a
                href={payment.qrisUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors mb-4"
              >
                <ExternalLink size={12} />
                Buka halaman pembayaran di tab baru
              </a>
            )}

            <div className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw size={12} className="animate-spin" />
                Menunggu pembayaran...
              </div>
              {countdown && (
                <div className={cn(
                  "flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-lg",
                  isExpired
                    ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                )}>
                  <Timer size={12} />
                  {isExpired ? "Expired" : countdown}
                </div>
              )}
            </div>
          </div>
        )}

        {isPaid && (
          <div className="px-6 py-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <p className="font-bold text-foreground text-lg">Pembayaran Diterima</p>
            {payment.payerIssuer && (
              <p className="text-xs text-muted-foreground mt-1">
                Dibayar via <span className="font-semibold">{payment.payerIssuer}</span>
              </p>
            )}
            {payment.confirmedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Dikonfirmasi pada {formatDate(payment.confirmedAt)}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Order Anda telah diproses. Anda akan diarahkan ke halaman riwayat...
            </p>
            <button
              onClick={() => {
                const historyPath = getHistoryPath(payment.serviceName);
                const orderId = payment.orderId || (payment as Record<string, unknown>).order_id;
                navigate(orderId ? `${historyPath}?open=${orderId}` : historyPath);
              }}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
            >
              <ExternalLink size={14} />
              Lihat Riwayat Pesanan
            </button>
          </div>
        )}

        {isFailed && (
          <div className="px-6 py-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-4">
              <RotateCcw size={32} className="text-red-400" />
            </div>
            <p className="font-bold text-foreground text-lg">
              {payment.status === "KADALUARSA" ? "Pembayaran Kadaluarsa" : "Pembayaran Gagal"}
            </p>
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Silakan buat order baru untuk melakukan pemesanan ulang.
            </p>
            <a href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-brand hover:opacity-90 transition-opacity mt-4">
              Kembali ke Dashboard
            </a>
          </div>
        )}

        {payment.expiresAt && isWaiting && (
          <div className="px-6 py-4 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Batas Waktu Pembayaran</span>
              <span>{formatDate(payment.expiresAt)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <CekbarIcon size={16} />
        <span>Pembayaran aman via QRIS GoPay — Cekbar</span>
      </div>
    </div>
  );
}
