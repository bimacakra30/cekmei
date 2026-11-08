import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { statusConfig } from "@/lib/status-config";
import type { Order } from "@/types";

type RecentOrdersTableProps = {
  orders: Order[];
};

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const recentOrders = orders.slice(0, 10);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border">
        <div>
          <h2 className="text-base font-bold text-foreground">Pesanan Terakhir</h2>
          <p className="text-xs text-muted-foreground mt-0.5">10 pesanan terbaru Anda</p>
        </div>
        <Link to="/riwayat/pesanan-ceir"
          className="text-[13px] font-semibold text-brand-primary hover:underline underline-offset-4 transition-colors"
        >
          Lihat Semua
        </Link>
      </div>

      {recentOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
            <Package size={22} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">Belum ada pesanan</p>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Buat pesanan pertama dengan memilih layanan di sidebar.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">Pesanan terbaru</caption>
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-5 sm:px-6 py-3">
                  Order ID
                </th>
                <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-5 py-3">
                  Layanan
                </th>
                <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-5 py-3 hidden md:table-cell">
                  IMEI
                </th>
                <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-5 sm:px-6 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentOrders.map((order) => {
                const status = statusConfig[order.status] ?? statusConfig.PENDING;
                return (
                  <tr
                    key={order.orderId}
                    className="transition-colors hover:bg-muted/40 group"
                  >
                    <td className="px-5 sm:px-6 py-4">
                      <span className="text-[13px] font-mono font-medium text-foreground">
                        {order.orderId}
                      </span>
                      <span className="block text-[11px] text-muted-foreground mt-0.5">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[13px] text-foreground font-medium">
                        {order.serviceName}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-[12px] font-mono text-muted-foreground">
                        {order.imeiList[0]}
                        {order.imeiList.length > 1 && (
                          <span className="text-[11px] ml-1.5 text-blue-500 font-semibold">
                            +{order.imeiList.length - 1} lainnya
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 sm:px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                          status.pill
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", status.dot)} aria-hidden="true" />
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
