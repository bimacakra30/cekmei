import { formatRupiah, formatDate } from "@/lib/utils";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Download, ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";

type Transaction = {
  id: string;
  type: "IN" | "OUT";
  description: string;
  relatedOrder?: string;
  amount: number;
  date: string;
};

const PER_PAGE = 20;

export default function AdminTransaksiPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0, profit: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [page, setPage] = useState(1);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/transactions", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions ?? []);
        setSummary(data.summary ?? { totalIn: 0, totalOut: 0, profit: 0 });
      }
    } catch {
      console.error("Gagal fetch transaksi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const filtered = useMemo(() => transactions.filter((t) => {
    const matchSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.relatedOrder?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchType = filterType === "ALL" || t.type === filterType;
    return matchSearch && matchType;
  }), [transactions, searchQuery, filterType]);

  useEffect(() => { setPage(1); }, [searchQuery, filterType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function handleExportCSV() {
    if (filtered.length === 0) return;

    const header = "ID,Tipe,Deskripsi,Ref Order,Jumlah,Waktu";
    const rows = filtered.map((t) => {
      const desc = t.description.replace(/,/g, ";").replace(/"/g, '""');
      const dateStr = t.date ? formatDate(t.date) : "";
      return `"${t.id}","${t.type === "IN" ? "Masuk" : "Keluar"}","${desc}","${t.relatedOrder ?? ""}",${t.type === "IN" ? "" : "-"}${t.amount},"${dateStr}"`;
    });

    const csvContent = "\uFEFF" + header + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transaksi_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft size={16} className="text-emerald-500" />
            <span className="text-xs text-muted-foreground font-medium">Pemasukan</span>
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {loading ? "..." : formatRupiah(summary.totalIn)}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight size={16} className="text-red-500" />
            <span className="text-xs text-muted-foreground font-medium">Pengeluaran (ke Seller)</span>
          </div>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            {loading ? "..." : formatRupiah(summary.totalOut)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Berdasarkan harga beli layanan</p>
        </div>
        <div className="bg-card rounded-xl border border-border px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground font-medium">💰 Laba Kotor</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {loading ? "..." : formatRupiah(summary.profit)}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          >
            <option value="ALL">Semua Tipe</option>
            <option value="IN">Pemasukan</option>
            <option value="OUT">Pengeluaran</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransactions}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors shrink-0"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">ID</th>
                <th className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Tipe</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Deskripsi</th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Jumlah</th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Memuat transaksi...</p>
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    {transactions.length === 0 ? "Belum ada transaksi" : "Tidak ada transaksi ditemukan"}
                  </td>
                </tr>
              ) : (
                paged.map((trx) => (
                  <tr key={trx.id} className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-mono font-medium text-foreground">{trx.id}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {trx.type === "IN" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <ArrowDownLeft size={12} /> Masuk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400">
                          <ArrowUpRight size={12} /> Keluar
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-foreground">{trx.description}</p>
                      {trx.relatedOrder && (
                        <p className="text-[11px] text-muted-foreground font-mono">Ref: {trx.relatedOrder}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-sm font-medium ${trx.type === "IN" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {trx.type === "IN" ? "+" : "-"}{formatRupiah(trx.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(trx.date)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Menampilkan {paged.length} dari {filtered.length} transaksi
            {filtered.length !== transactions.length && ` (total ${transactions.length})`}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-xs font-medium text-foreground bg-muted rounded-lg">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
