import { X, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderResult } from "@/types";

type OrderResultModalProps = {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  orderId: string;
  results: OrderResult[];
};

const statusIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  Terdaftar: { icon: <CheckCircle2 size={16} />, color: "text-status-success" },
  Bersih: { icon: <CheckCircle2 size={16} />, color: "text-status-success" },
  Valid: { icon: <CheckCircle2 size={16} />, color: "text-status-success" },
  Unlocked: { icon: <CheckCircle2 size={16} />, color: "text-status-success" },
  Gagal: { icon: <XCircle size={16} />, color: "text-status-error" },
  Diproses: { icon: <Clock size={16} />, color: "text-status-warning" },
};

export function OrderResultModal({
  isOpen,
  onClose,
  serviceName,
  orderId,
  results,
}: OrderResultModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-foreground">Hasil {serviceName}</h3>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{orderId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {results.map((result, idx) => {
              const statusInfo = statusIcons[result.status] || {
                icon: <Clock size={16} />,
                color: "text-muted-foreground",
              };

              return (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-semibold text-foreground">
                      {result.imei}
                    </p>
                    {result.detail && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {result.detail}
                      </p>
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0",
                      statusInfo.color,
                      result.status === "Gagal"
                        ? "bg-red-100 dark:bg-red-900/20"
                        : "bg-green-100 dark:bg-green-900/20"
                    )}
                  >
                    {statusInfo.icon}
                    {result.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
