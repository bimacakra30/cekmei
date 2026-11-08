import { cn } from "@/lib/utils";

export type CeirResultsData = {
  ceir_order_id?: string;
  service_id?: number;
  result?: unknown;
  processed?: number;
  total_potong?: number;
  transaction_id?: string;
  error?: string;
  errorCode?: string;
};

export type OrderResult = {
  imei?: string;
  status?: string;
  detail?: string;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function isCeirResults(results: unknown): results is CeirResultsData {
  return typeof results === "object" && results !== null && "service_id" in results;
}

export function getServiceLabel(serviceId?: number): string {
  switch (serviceId) {
    case 30: return "STATUS IMEI CEIR";
    case 31: return "HISTORY IMEI CEIR";
    case 38: return "VALID ROAMER CEIR";
    case 39: return "IMEI BEA CUKAI";
    default: return "CEIR";
  }
}

export function getStatusCatatan(status: string, imei: string): { type: "info" | "warning" | "error"; text: string } | null {
  switch (status) {
    case "REGISTERED":
      return {
        type: "info",
        text: `IMEI ${imei} terdaftar di database CEIR. Perangkat ini telah melewati proses registrasi resmi dan aman digunakan di Indonesia.`,
      };
    case "UNREGISTERED":
      return {
        type: "error",
        text: `IMEI perangkat tidak terdaftar di database CEIR. Status ini berisiko tinggi mengalami pemblokiran sinyal. Namun Anda masih bisa mendapatkan sinyal dengan melakukan registrasi IMEI melalui layanan Order IMEI 1 Bulan atau 3 Bulan yang tersedia di platform kami.`,
      };
    case "UNKNOWN":
      return {
        type: "error",
        text: `IMEI perangkat tidak dikenal atau tidak terdaftar di database CEIR. Status ini berisiko tinggi mengalami pemblokiran sinyal. Namun Anda masih bisa mendapatkan sinyal dengan melakukan registrasi IMEI melalui layanan Order IMEI 1 Bulan atau 3 Bulan yang tersedia di platform kami.`,
      };
    default:
      return null;
  }
}

export function StatusCatatan({ result }: { result: Record<string, string[]> }) {
  return (
    <>
      {Object.entries(result).flatMap(([status, imeis]) =>
        imeis.map((imei, i) => {
          const catatan = getStatusCatatan(status, imei);
          if (!catatan) return null;
          return (
            <div
              key={`cat-${status}-${i}`}
              className={cn(
                "rounded-xl px-4 py-3 border-l-4",
                catatan.type === "info" && "bg-blue-50 dark:bg-blue-950/20 border-blue-400",
                catatan.type === "error" && "bg-red-50 dark:bg-red-950/20 border-red-400",
                catatan.type === "warning" && "bg-amber-50 dark:bg-amber-950/20 border-amber-400",
              )}
            >
              <p className={cn(
                "text-sm font-semibold mb-1",
                catatan.type === "info" && "text-blue-700 dark:text-blue-300",
                catatan.type === "error" && "text-red-700 dark:text-red-300",
                catatan.type === "warning" && "text-amber-700 dark:text-amber-300",
              )}>
                Catatan IMEI {i + 1} ({imei}):
              </p>
              <p className={cn(
                "text-sm leading-relaxed",
                catatan.type === "info" && "text-blue-600 dark:text-blue-400",
                catatan.type === "error" && "text-red-600 dark:text-red-400",
                catatan.type === "warning" && "text-amber-600 dark:text-amber-400",
              )}>
                {catatan.text}
              </p>
            </div>
          );
        })
      )}
    </>
  );
}
