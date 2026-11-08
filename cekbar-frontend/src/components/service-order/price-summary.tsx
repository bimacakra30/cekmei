import { formatRupiah } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Tag, Hash, Coins, ArrowRight } from "lucide-react";

type PriceSummaryProps = {
  pricePerUnit: number;
  validCount: number;
};

export function PriceSummary({ pricePerUnit, validCount }: PriceSummaryProps) {
  const subtotal = pricePerUnit * validCount;
  const hasItems = validCount > 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mx-auto mb-2">
            <Tag size={14} className="text-violet-500" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Harga / IMEI
          </p>
          <p className="text-base font-bold text-foreground">{formatRupiah(pricePerUnit)}</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 text-center relative">
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center">
            <ArrowRight size={10} className="text-muted-foreground" />
          </div>
          <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center">
            <ArrowRight size={10} className="text-muted-foreground" />
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
            <Hash size={14} className="text-blue-500" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Jumlah
          </p>
          <p className={cn(
            "text-base font-bold transition-colors",
            hasItems ? "text-foreground" : "text-muted-foreground"
          )}>
            {validCount} <span className="text-xs font-normal text-muted-foreground">IMEI</span>
          </p>
        </div>

        <div className={cn(
          "rounded-xl p-4 text-center transition-all duration-300",
          hasItems
            ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20"
            : "bg-card border border-border"
        )}>
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2",
            hasItems ? "bg-white/20" : "bg-emerald-500/10"
          )}>
            <Coins size={14} className={hasItems ? "text-white" : "text-emerald-500"} />
          </div>
          <p className={cn(
            "text-[10px] font-semibold uppercase tracking-wider mb-1",
            hasItems ? "text-white/70" : "text-muted-foreground"
          )}>
            Total Bayar
          </p>
          <p className={cn(
            "text-base font-bold transition-colors",
            hasItems ? "text-white" : "text-muted-foreground"
          )}>
            {formatRupiah(subtotal)}
          </p>
          {hasItems && (
            <p className="text-[10px] text-white/50 mt-1">
              via QRIS GoPay
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
