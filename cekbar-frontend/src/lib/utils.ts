import { clsx, type ClassValue } from "clsx";

/**
 * Merge Tailwind classes dengan clsx
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format angka ke Rupiah
 * Contoh: formatRupiah(100000) → "Rp 100.000"
 */
export function formatRupiah(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp ${formatted}`;
}

/**
 * Format tanggal ke format Indonesia
 * Contoh: "23 Sep 2026, 21.43"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Validasi IMEI — harus tepat 15 digit angka
 */
export function isValidIMEI(imei: string): boolean {
  return /^\d{15}$/.test(imei.trim());
}

/**
 * Parse teks multi-baris menjadi array IMEI, filter hanya yang valid
 */
export function parseIMEIList(text: string): {
  all: string[];
  valid: string[];
  invalid: string[];
} {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const valid = lines.filter(isValidIMEI);
  const invalid = lines.filter((l) => !isValidIMEI(l));

  return { all: lines, valid, invalid };
}

/**
 * Generate Order ID dummy
 * Format: BARA-ORD-<timestamp>-<random>
 */
export function generateOrderId(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `BARA-ORD-${timestamp}-${random}`;
}
