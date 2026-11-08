import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Loader2,
  X,
  Clock,
  QrCode,
  Search,
  ShieldAlert,
  BookOpen,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseIMEIList, formatRupiah } from "@/lib/utils";
import { placeOrder } from "@/lib/services";
import { ImeiInput } from "./imei-input";
import { SyaratKetentuanContent } from "@/pages/main/TermsPage";
import type { Service, Order } from "@/types";
import { setSessionFlag, isSessionFlagActive } from "@/lib/session-flag";

type ServiceOrderPageProps = {
  services: Service[];
  categorySlug: string;
  categoryLabel: string;
};

export function ServiceOrderPage({ services, categorySlug, categoryLabel }: ServiceOrderPageProps) {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const firstActive = services.findIndex(s => s.isOnline);
    return firstActive >= 0 ? firstActive : 0;
  });
  const [imeiText, setImeiText] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [showTnC, setShowTnC] = useState(false);
  const [showUnblockInfo, setShowUnblockInfo] = useState(false);
  const [mounted, setMounted] = useState(false);

  const service = services[selectedIndex];

  useEffect(() => {
    if (service) setAgreed(!service.requiresAgreement);
  }, [selectedIndex, service?.requiresAgreement]);

  useEffect(() => { setMounted(true); }, []);

  if (!service) return null;

  useEffect(() => {
    if (categorySlug === "unblock-imei" && !isSessionFlagActive("unblock_info_shown")) {
      setShowUnblockInfo(true);
      setSessionFlag("unblock_info_shown");
    }
  }, [categorySlug]);

  useEffect(() => {
    if (showTnC || showUnblockInfo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showTnC, showUnblockInfo]);

  useEffect(() => {
    setOrderError(null);
  }, [selectedIndex, imeiText]);

  const { valid: validImeis, invalid: invalidImeis } = parseIMEIList(imeiText);
  const totalPrice = validImeis.length * (service?.pricePerUnit ?? 0);
  const canSubmit = validImeis.length > 0 && agreed && !isSubmitting;

  const [directOrderResult, setDirectOrderResult] = useState<{
    orderId: string;
    status: string;
    serviceName: string;
  } | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setOrderError(null);
    try {
      type PlaceOrderResult = Order & { paymentId?: string; isDirectOrder?: boolean };
      const order = await placeOrder({
        serviceId: service.id,
        serviceName: service.name,
        imeiList: validImeis,
        pricePerUnit: service.pricePerUnit,
      }) as PlaceOrderResult;

      if (order.isDirectOrder) {
        setDirectOrderResult({
          orderId: order.orderId,
          status: order.status,
          serviceName: service.name,
        });
        setImeiText("");
        return;
      }

      if (order.paymentId) {
        navigate(`/pembayaran/${order.paymentId}`);
      } else {
        throw new Error("Payment ID tidak ditemukan");
      }
    } catch (err) {
      console.error("handleSubmit error:", err);
      const message = err instanceof Error ? err.message : "Terjadi kesalahan, silakan coba lagi.";
      setOrderError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, service, validImeis, navigate]);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20">

      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-2">
          {categoryLabel} · Order baru
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
          Pilih layanan, masukkan IMEI
        </h1>

        {service.bannerInfo && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={14} className="shrink-0" />
            <span>{service.bannerInfo}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        <div className="lg:col-span-8 space-y-6">

          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3">Pilih Layanan</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map((svc, i) => {
                const isSelected = i === selectedIndex;
                const isDisabled = !svc.isOnline;
                return (
                  <button
                    key={svc.id}
                    onClick={() => { if (!isDisabled) setSelectedIndex(i); }}
                    disabled={isDisabled}
                    className={cn(
                      "flex flex-col gap-1 px-4 py-3.5 rounded-xl border-2 text-left transition-colors",
                      isDisabled
                        ? "border-transparent bg-card ring-1 ring-border opacity-50 cursor-not-allowed"
                        : isSelected
                          ? "border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 shadow-sm"
                          : "border-transparent bg-card ring-1 ring-border hover:ring-brand-primary/40"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {svc.name}
                      </span>
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-medium shrink-0",
                        svc.isOnline ? "text-emerald-500" : "text-red-500"
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          svc.isOnline ? "bg-emerald-500" : "bg-red-500"
                        )} />
                        {svc.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                    {svc.processTime && (
                      <span className="text-xs text-muted-foreground">{svc.processTime}</span>
                    )}
                    <span className={cn(
                      "text-sm font-semibold mt-0.5",
                      isSelected ? "text-brand-primary" : "text-muted-foreground"
                    )}>
                      {formatRupiah(svc.pricePerUnit)} / IMEI
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3">Daftar IMEI</h2>

            <div className="bg-card rounded-xl border border-border p-5">
              <ImeiInput
                value={imeiText}
                onChange={setImeiText}
                label={service.inputLabel}
                disabled={isSubmitting}
              />
            </div>
          </section>

          {service.requiresAgreement && (
            <section>
              <h2 className="text-sm font-semibold text-foreground mb-3">Persetujuan</h2>

              <div className="bg-card rounded-xl border border-border px-5 py-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      disabled={isSubmitting}
                      className="sr-only peer"
                    />
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                      agreed
                        ? "bg-brand-primary border-brand-primary"
                        : "border-border group-hover:border-brand-primary/60"
                    )}>
                      {agreed && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                  </div>
                  <span className="text-sm text-foreground leading-relaxed">
                    Saya sudah membaca dan menyetujui{" "}
                    <button
                      type="button"
                      onClick={() => setShowTnC(true)}
                      className="text-brand-primary hover:underline font-semibold underline-offset-2 transition-colors"
                    >
                      Syarat &amp; Ketentuan
                    </button>
                  </span>
                </label>
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-20">
            <div className="rounded-xl overflow-hidden shadow-sm border border-border">

              <div className="gradient-brand px-5 pt-5 pb-4">
                <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wide mb-1.5">Ringkasan</p>
                <h3 className="text-base font-bold text-white leading-snug">{service.name}</h3>
              </div>

              <div className="bg-card">

              <div className="px-5 py-4 space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Harga per IMEI</span>
                  <span className="text-foreground font-semibold tabular-nums">{formatRupiah(service.pricePerUnit)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">IMEI valid</span>
                  <span className="text-foreground font-semibold tabular-nums">{validImeis.length}</span>
                </div>
                {invalidImeis.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Perlu diperbaiki</span>
                    <span className="text-red-500 font-semibold tabular-nums">{invalidImeis.length} baris</span>
                  </div>
                )}
              </div>

              <div className="h-px bg-border mx-5" />

              <div className="px-5 py-4">
                <p className="text-xs text-muted-foreground mb-1">Total bayar</p>
                <p className={cn(
                  "text-2xl font-extrabold tracking-tight transition-colors",
                  validImeis.length > 0 ? "text-foreground" : "text-muted-foreground/30"
                )}>
                  {formatRupiah(totalPrice)}
                </p>
              </div>

              <div className="mx-5 flex items-center gap-2.5 px-3.5 py-3 bg-muted/60 border border-border rounded-lg">
                <QrCode size={16} className="text-brand-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">Bayar dengan QRIS</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">GoPay, DANA, OVO, ShopeePay, e-wallet</p>
                </div>
              </div>

              <div className="p-5">
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={cn(
                    "w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                    canSubmit
                      ? "gradient-brand text-white hover:opacity-90 active:scale-[0.98]"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      {canSubmit
                        ? `Bayar ${formatRupiah(totalPrice)}`
                        : "Masukkan IMEI"
                      }
                    </>
                  )}
                </button>

                {orderError && (
                  <div className="mt-3 flex items-start gap-2.5 px-3.5 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-red-500">Gagal membuat pesanan</p>
                      <p className="text-[11px] text-red-400 mt-0.5">{orderError}</p>
                    </div>
                    <button
                      onClick={() => setOrderError(null)}
                      className="text-red-400/60 hover:text-red-500 transition-colors shrink-0 mt-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {invalidImeis.length > 0 && validImeis.length > 0 && (
                  <p className="text-[11px] text-muted-foreground text-center mt-3">
                    Baris yang belum valid tidak ikut dihitung.
                  </p>
                )}
              </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {mounted && showTnC && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTnC(false); }}
        >
          <div className="relative w-full max-w-2xl bg-card rounded-xl border border-border animate-fade-in flex flex-col" style={{ maxHeight: "calc(100vh - 2rem)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-bold text-foreground">Syarat &amp; Ketentuan</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {service.name.includes("Roamer") ? "Add Roamer" : service.name}
                </p>
              </div>
              <button
                onClick={() => setShowTnC(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <SyaratKetentuanContent />
            </div>
          </div>
        </div>,
        document.body
      )}

      {mounted && directOrderResult && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDirectOrderResult(null)}
        >
          <div
            className="relative w-full max-w-md bg-card rounded-xl border border-border animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Order Berhasil Dibuat</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {directOrderResult.serviceName}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg px-4 py-3 text-left space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono text-xs text-foreground">{directOrderResult.orderId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs">
                    {directOrderResult.status === "PENDING" ? "Menunggu Proses" : directOrderResult.status}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Pesanan akan diproses oleh admin. Cek progress di menu Riwayat.
              </p>
              <button
                onClick={() => setDirectOrderResult(null)}
                className="w-full py-3 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                OK
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {mounted && showUnblockInfo && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowUnblockInfo(false); }}
        >
          <div className="relative w-full max-w-lg bg-card rounded-xl border border-border animate-fade-in flex flex-col" style={{ maxHeight: "calc(100vh - 2rem)" }}>

            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Info size={18} className="text-amber-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Informasi Penting</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Baca sebelum melakukan pemesanan</p>
                </div>
              </div>
              <button
                onClick={() => setShowUnblockInfo(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">

              <div className="flex gap-3 p-4 bg-muted/60 border border-border rounded-lg">
                <Clock size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Jam Operasional: 10.00 – 21.00 WIB</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pesanan yang masuk di luar jam operasional akan dikerjakan keesokan harinya di pagi hari.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 bg-blue-500/5 border border-blue-500/15 rounded-lg">
                <Search size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Cek Status CEIR Terlebih Dahulu</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Sebelum melakukan pemesanan, disarankan untuk mengecek status CEIR perangkat Anda secara mandiri melalui menu{" "}
                    <span className="font-semibold text-brand-primary">Cek IMEI</span> di sidebar.
                    Ini membantu memastikan IMEI Anda bisa diproses.
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1.5 italic">Opsional, tapi sangat direkomendasikan</p>
                </div>
              </div>

              <div className="flex gap-3 p-4 bg-red-500/5 border border-red-500/15 rounded-lg">
                <ShieldAlert size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Status IMEI Wajib UNKNOWN</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Layanan Unblock IMEI / Add Roamer <span className="font-semibold text-red-500">hanya bisa memproses</span> IMEI
                    dengan status CEIR <span className="font-semibold text-foreground">UNKNOWN</span>.
                    IMEI dengan status lain (Registered, Blacklisted, dll.) tidak dapat diproses dan{" "}
                    <span className="font-semibold text-red-500">tidak ada refund</span>.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 bg-amber-500/5 border border-amber-500/15 rounded-lg">
                <BookOpen size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Wajib Baca Syarat & Ketentuan</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Anda <span className="font-semibold text-foreground">wajib membaca</span> Syarat & Ketentuan sebelum melakukan order.
                    Dengan melanjutkan pemesanan, Anda dianggap telah memahami dan menyetujui seluruh ketentuan yang berlaku.
                  </p>
                </div>
              </div>

            </div>

            <div className="px-6 pb-6 pt-2">
              <button
                onClick={() => setShowUnblockInfo(false)}
                className="w-full py-3 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Saya Mengerti, Lanjutkan
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
