import { lazy, Suspense } from "react";
import { useState, useEffect, useCallback } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  Loader2, RefreshCw, TrendingUp, Wallet,
  ShoppingCart, XCircle, Users, Clock,
  CheckCircle2, CreditCard, CalendarDays,
} from "lucide-react";
import { statusConfig } from "@/lib/status-config";

const RevenueChart = lazy(() => import("./admin-charts").then(m => ({ default: m.RevenueChart })));
const StatusPieChart = lazy(() => import("./admin-charts").then(m => ({ default: m.StatusPieChart })));
const TopServicesChart = lazy(() => import("./admin-charts").then(m => ({ default: m.TopServicesChart })));

type Stats = {
  totalRevenue: number;
  totalSeller: number;
  netRevenue: number;
  totalOrders: number;
  totalSuccess: number;
  totalFailed: number;
  activeUsers: number;
  ordersToday: number;
  pendingOrders: number;
  ceirBalance: number | null;
};

type DailyRevenue = { day: string; revenue: number; count: number };
type StatusChart  = { status: string; total: number };
type TopService   = { name: string; orders: number; revenue: number };
type RecentOrder = {
  id: string; user: string; service: string;
  amount: number; status: string; paymentType: string | null; date: string;
};



function RevenueCard({
  label, value, icon: Icon, gradient,
}: {
  label: string; value: number;
  icon: React.ElementType; gradient: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl p-5 transition-shadow duration-200 hover:shadow-md">
      <div className={`absolute inset-0 ${gradient}`} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/20">
            <Icon size={17} className="text-white" />
          </div>
        </div>
        <p className="text-xs text-white/75 mb-1">{label}</p>
        <p className="text-xl font-bold text-white tracking-tight">{formatRupiah(value)}</p>
      </div>
    </div>
  );
}

function MetricCard({
  label, value, icon: Icon, iconColor, iconBg,
}: {
  label: string; value: string;
  icon: React.ElementType; iconColor: string; iconBg: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 transition-colors duration-150 hover:border-border/80">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}



export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0, totalSeller: 0, netRevenue: 0,
    totalOrders: 0, totalSuccess: 0, totalFailed: 0, activeUsers: 0,
    ordersToday: 0, pendingOrders: 0, ceirBalance: null,
  });
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [statusChart, setStatusChart]   = useState<StatusChart[]>([]);
  const [topServices, setTopServices]   = useState<TopService[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [timeRange, setTimeRange]       = useState<"today"|"week"|"month">("today");

  const fetchStats = useCallback(async (range: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${range}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setDailyRevenue(data.charts?.dailyRevenue ?? []);
        setStatusChart(data.charts?.statusChart ?? []);
        setTopServices(data.charts?.topServices ?? []);
        setRecentOrders(data.recentOrders ?? []);
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchStats(timeRange); }, [timeRange]); // eslint-disable-line

  const rangeLabel = timeRange === "today" ? "Hari Ini" : timeRange === "week" ? "7 Hari" : "30 Hari";

  return (
    <div className="space-y-6 animate-fade-in">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground">Ringkasan bisnis & aktivitas</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStats(timeRange, true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border">
            {(["today","week","month"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                  timeRange === r
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r === "today" && <CalendarDays size={12} />}
                {r === "today" ? "Hari Ini" : r === "week" ? "7 Hari" : "30 Hari"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={24} className="animate-spin text-brand-primary" />
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <RevenueCard
              label={`Pendapatan Kotor · ${rangeLabel}`}
              value={stats.totalRevenue}
              icon={TrendingUp}
              gradient="gradient-brand"
            />
            <RevenueCard
              label={`Setoran ke Seller · ${rangeLabel}`}
              value={stats.totalSeller}
              icon={Wallet}
              gradient="bg-gradient-to-br from-violet-500 to-violet-600"
            />
            <RevenueCard
              label={`Pendapatan Bersih · ${rangeLabel}`}
              value={stats.netRevenue}
              icon={TrendingUp}
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
            />
            {stats.ceirBalance !== null && (
              <RevenueCard
                label="Saldo CEIR"
                value={stats.ceirBalance}
                icon={CreditCard}
                gradient="bg-gradient-to-br from-sky-500 to-sky-600"
              />
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              label="Total Pesanan"
              value={stats.totalOrders.toString()}
              icon={ShoppingCart} iconBg="bg-violet-500/10" iconColor="#8b5cf6"
            />
            <MetricCard
              label="Pesanan Berhasil"
              value={stats.totalSuccess.toString()}
              icon={CheckCircle2} iconBg="bg-emerald-500/10" iconColor="#10b981"
            />
            <MetricCard
              label="Pesanan Gagal"
              value={stats.totalFailed.toString()}
              icon={XCircle} iconBg="bg-red-500/10" iconColor="#ef4444"
            />
            <MetricCard
              label="Pengguna Aktif"
              value={stats.activeUsers.toString()}
              icon={Users} iconBg="bg-cyan-500/10" iconColor="#06b6d4"
            />
            <MetricCard
              label="Pending"
              value={stats.pendingOrders.toString()}
              icon={Clock} iconBg="bg-amber-500/10" iconColor="#f59e0b"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <RevenueChart data={dailyRevenue} />
            <StatusPieChart data={statusChart} />
          </div>

          {topServices.length > 0 && (
            <TopServicesChart data={topServices} />
          )}

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-amber-500" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Pesanan Terbaru</h3>
                  <p className="text-xs text-muted-foreground">{rangeLabel}</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Order ID","Pengguna","Layanan","Jumlah","Status","Waktu"].map((h) => (
                      <th key={h} className={`text-xs font-medium text-muted-foreground px-5 py-3 ${h === "Jumlah" || h === "Waktu" ? "text-right" : h === "Status" ? "text-center" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {refreshing ? (
                    <tr><td colSpan={6} className="py-10 text-center"><Loader2 size={18} className="animate-spin mx-auto text-muted-foreground" /></td></tr>
                  ) : recentOrders.length === 0 ? (
                    <tr><td colSpan={6} className="py-14 text-center text-sm text-muted-foreground">Tidak ada pesanan pada periode ini</td></tr>
                  ) : recentOrders.map((order) => {
                    const sc = statusConfig[order.status] ?? { label: order.status, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-950/30" };
                    return (
                      <tr key={order.id} className="border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3"><span className="text-xs font-mono text-foreground">{order.id}</span></td>
                        <td className="px-5 py-3"><span className="text-sm font-medium text-foreground">{order.user}</span></td>
                        <td className="px-5 py-3"><span className="text-sm text-muted-foreground">{order.service}</span></td>
                        <td className="px-5 py-3 text-right"><span className="text-sm font-semibold text-foreground">{formatRupiah(order.amount)}</span></td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${sc.color} ${sc.bg}`}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusConfig[order.status]?.fill ?? "#6b7280" }} aria-hidden="true" />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right"><span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(order.date)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
