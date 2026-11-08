import { formatRupiah } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { BarChart3, TrendingUp, ShoppingCart } from "lucide-react";
import { statusConfig } from "@/lib/status-config";

export function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: {value:number}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold text-foreground">{formatRupiah(payload[0]?.value ?? 0)}</p>
      {payload[1] && <p className="text-muted-foreground mt-0.5">{payload[1].value} transaksi</p>}
    </div>
  );
}

export function fmtDay(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

type DailyRevenue = { day: string; revenue: number; count: number };
type StatusChart  = { status: string; total: number };
type TopService   = { name: string; orders: number; revenue: number };

export function RevenueChart({ data }: { data: DailyRevenue[] }) {
  return (
    <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 size={16} className="text-brand-primary" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">Pendapatan Harian</h3>
          <p className="text-xs text-muted-foreground">7 hari terakhir</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenueGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
          <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGrad2)" dot={{ r: 3, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusPieChart({ data }: { data: StatusChart[] }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={16} className="text-violet-500" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">Status Pesanan</h3>
          <p className="text-xs text-muted-foreground">Distribusi semua waktu</p>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[200px] text-sm text-muted-foreground">
          <ShoppingCart size={20} className="mb-2 text-muted-foreground/50" />
          Belum ada pesanan
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="status"
              cx="50%" cy="50%"
              innerRadius={50} outerRadius={75}
              paddingAngle={4}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.status} fill={statusConfig[entry.status]?.fill ?? "#6b7280"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, name) => [v, statusConfig[name as string]?.label ?? name]}
              contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid var(--border)", background: "var(--card)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
      <div className="mt-3 space-y-1.5">
        {data.map((s) => (
          <div key={s.status} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: statusConfig[s.status]?.fill ?? "#6b7280" }} />
              <span className="text-muted-foreground">{statusConfig[s.status]?.label ?? s.status}</span>
            </div>
            <span className="font-semibold text-foreground">{s.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TopServicesChart({ data }: { data: TopService[] }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp size={16} className="text-emerald-500" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">Top Layanan</h3>
          <p className="text-xs text-muted-foreground">5 layanan terbanyak dipesan</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} opacity={0.5} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis
            type="category" dataKey="name" width={180}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false} tickLine={false}
            tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 28) + "…" : v}
          />
          <Tooltip
            formatter={(v) => [`${v} pesanan`]}
            contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid var(--border)", background: "var(--card)" }}
          />
          <Bar dataKey="orders" radius={[0, 6, 6, 0]} maxBarSize={20}>
            {data.map((_, i) => (
              <Cell key={i} fill={["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef"][i % 5]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
