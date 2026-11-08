import { formatRupiah } from "@/lib/utils";

type CeirResults = {
  ceir_order_id?: string;
  service_id?: number;
  result?: unknown;
  processed?: number;
  total_potong?: number;
  transaction_id?: string;
  error?: string;
  errorCode?: string;
};

export function CeirResultRenderer({ results }: { results: CeirResults }) {
  if (results.error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg px-3 py-2.5">
        <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">
          Gagal: {results.error}
        </p>
        {results.errorCode && (
          <p className="text-[10px] text-red-500/70 mt-0.5 font-mono">{results.errorCode}</p>
        )}
      </div>
    );
  }

  const serviceId = results.service_id;
  const result = results.result;

  if (!result) {
    return (
      <p className="text-[11px] text-muted-foreground">Hasil belum tersedia</p>
    );
  }

  switch (serviceId) {
    case 30:
      return <StatusResult result={result} />;
    case 31:
      return <HistoryResult result={result} />;
    case 38:
      return <ValidityResult result={result} />;
    case 39:
      return (
        <BeaCukaiResult
          result={result}
          processed={results.processed}
          totalPotong={results.total_potong}
          transactionId={results.transaction_id}
        />
      );
    default:
      return <GenericResult result={result} />;
  }
}

function StatusResult({ result }: { result: unknown }) {
  const data = result as Record<string, string[]>;
  const categories = Object.entries(data);

  const statusStyle: Record<string, { label: string; color: string; bg: string }> = {
    REGISTERED:   { label: "REGISTERED",   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    UNREGISTERED: { label: "UNREGISTERED", color: "text-red-500",                           bg: "bg-red-500/10" },
    UNKNOWN:      { label: "UNKNOWN",      color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-500/10" },
  };

  return (
    <div className="space-y-1.5">
      {categories.map(([status, imeis]) =>
        imeis.map((imei, i) => {
          const style = statusStyle[status] ?? { label: status, color: "text-muted-foreground", bg: "bg-muted" };
          return (
            <div key={`${status}-${i}`} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2.5">
              <span className="text-[11px] font-mono text-muted-foreground shrink-0">{imei}</span>
              <span className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full ${style.color} ${style.bg}`}>
                {style.label}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

type HistoryEntry = {
  no: number;
  date: string;
  imei: string;
  imsi: string;
  action: string;
  note: string;
};

type HistoryItem = {
  imei: string;
  history: HistoryEntry[];
};

function HistoryResult({ result }: { result: unknown }) {
  const data = result as HistoryItem[];

  return (
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={idx} className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-muted/30 border-b border-border">
            <span className="text-[11px] font-mono font-medium text-foreground">IMEI: {item.imei}</span>
          </div>
          {item.history && item.history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-3 py-1.5 text-muted-foreground font-semibold">No</th>
                    <th className="text-left px-3 py-1.5 text-muted-foreground font-semibold">Tanggal</th>
                    <th className="text-left px-3 py-1.5 text-muted-foreground font-semibold">IMEI</th>
                    <th className="text-left px-3 py-1.5 text-muted-foreground font-semibold">IMSI</th>
                    <th className="text-left px-3 py-1.5 text-muted-foreground font-semibold">Action</th>
                    <th className="text-left px-3 py-1.5 text-muted-foreground font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {item.history.map((h, hi) => (
                    <tr key={hi} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-1.5 text-muted-foreground">{h.no}</td>
                      <td className="px-3 py-1.5 text-foreground font-mono">{h.date}</td>
                      <td className="px-3 py-1.5 text-muted-foreground font-mono">{h.imei === "----" ? "—" : h.imei}</td>
                      <td className="px-3 py-1.5 text-muted-foreground font-mono">{h.imsi === "----" ? "—" : h.imsi}</td>
                      <td className="px-3 py-1.5">
                        <span className={`font-medium ${
                          h.action === "add_roamer" ? "text-emerald-600 dark:text-emerald-400"
                          : h.action === "remove_roamer" ? "text-red-500"
                          : "text-muted-foreground"
                        }`}>
                          {h.action === "----" ? "—" : h.action}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">{h.note === "----" ? "—" : h.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-3 py-2 text-[11px] text-muted-foreground">Tidak ada riwayat</p>
          )}
        </div>
      ))}
    </div>
  );
}

type ValidityItem = {
  imei: string;
  status: string;
  valid_until: string | null;
};

function ValidityResult({ result }: { result: unknown }) {
  const data = result as ValidityItem[];

  const statusStyle: Record<string, { label: string; color: string; bg: string }> = {
    ROAMER:       { label: "Roamer Aktif",    color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    NOT_ROAMER:   { label: "Bukan Roamer",    color: "text-red-500",                           bg: "bg-red-500/10" },
    EXPIRED:      { label: "Expired",         color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-500/10" },
  };

  return (
    <div className="space-y-1.5">
      {data.map((item, idx) => {
        const style = statusStyle[item.status] ?? { label: item.status, color: "text-muted-foreground", bg: "bg-muted" };
        return (
          <div key={idx} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2.5">
            <span className="text-[11px] font-mono text-muted-foreground shrink-0">{item.imei}</span>
            <div className="flex items-center gap-2 ml-auto">
              {item.valid_until && (
                <span className="text-[10px] text-muted-foreground">
                  Valid s/d: <span className="font-mono">{item.valid_until}</span>
                </span>
              )}
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${style.color} ${style.bg}`}>
                {style.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type BeaCukaiItem = {
  imei: string;
  status: string;
  registered_at: string | null;
  checked_at: string | null;
};

function BeaCukaiResult({
  result,
  processed,
  totalPotong,
  transactionId,
}: {
  result: unknown;
  processed?: number;
  totalPotong?: number;
  transactionId?: string;
}) {
  const data = result as BeaCukaiItem[];

  const statusStyle: Record<string, { label: string; color: string; bg: string }> = {
    REGISTERED:   { label: "REGISTERED",   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    UNREGISTERED: { label: "UNREGISTERED", color: "text-red-500",                           bg: "bg-red-500/10" },
    UNKNOWN:      { label: "UNKNOWN",      color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-500/10" },
    ERROR:        { label: "ERROR",        color: "text-red-500",                           bg: "bg-red-500/10" },
  };

  return (
    <div className="space-y-2">
      {data.map((item, idx) => {
        const style = statusStyle[item.status] ?? { label: item.status, color: "text-muted-foreground", bg: "bg-muted" };
        return (
          <div key={idx} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2.5">
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-mono text-muted-foreground">{item.imei}</span>
              {item.registered_at && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Terdaftar: <span className="font-mono">{item.registered_at}</span>
                </p>
              )}
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${style.color} ${style.bg}`}>
              {style.label}
            </span>
          </div>
        );
      })}

      {(processed !== undefined || totalPotong !== undefined) && (
        <div className="flex items-center gap-4 bg-muted/30 rounded-lg px-3 py-2 text-[10px] text-muted-foreground">
          {processed !== undefined && (
            <span>Diproses: <strong className="text-foreground">{processed} IMEI</strong></span>
          )}
          {totalPotong !== undefined && (
            <span>Biaya: <strong className="text-foreground">{formatRupiah(totalPotong)}</strong></span>
          )}
          {transactionId && (
            <span className="ml-auto font-mono">TRX: {transactionId}</span>
          )}
        </div>
      )}
    </div>
  );
}

function GenericResult({ result }: { result: unknown }) {
  return (
    <pre className="text-[10px] font-mono text-muted-foreground bg-muted/30 rounded-lg p-3 overflow-x-auto max-h-60">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}
