import type { ElementType } from "react";
import { CheckCircle2, Loader2, Clock, CreditCard, XCircle, Timer } from "lucide-react";

export type OrderStatusKey = "SUCCESS" | "PROCESSING" | "PENDING" | "PENDING_PAYMENT" | "FAILED" | "EXPIRED";

export type StatusConfigEntry = {
  label: string;
  color: string;
  fill: string;
  bg: string;
  dot: string;
  pill: string;
  icon: ElementType;
};

export const statusConfig: Record<string, StatusConfigEntry> = {
  SUCCESS: {
    label: "Selesai",
    color: "text-emerald-600 dark:text-emerald-400",
    fill: "#10b981",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  PROCESSING: {
    label: "Diproses",
    color: "text-blue-600 dark:text-blue-400",
    fill: "#3b82f6",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    dot: "bg-blue-500",
    pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Loader2,
  },
  PENDING: {
    label: "Pending",
    color: "text-amber-600 dark:text-amber-400",
    fill: "#f59e0b",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    dot: "bg-amber-500",
    pill: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  PENDING_PAYMENT: {
    label: "Belum Bayar",
    color: "text-orange-600 dark:text-orange-400",
    fill: "#f97316",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    dot: "bg-orange-500",
    pill: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    icon: CreditCard,
  },
  FAILED: {
    label: "Gagal",
    color: "text-red-600 dark:text-red-400",
    fill: "#ef4444",
    bg: "bg-red-50 dark:bg-red-950/30",
    dot: "bg-red-500",
    pill: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    icon: XCircle,
  },
  EXPIRED: {
    label: "Expired",
    color: "text-gray-500",
    fill: "#6b7280",
    bg: "bg-gray-50 dark:bg-gray-950/30",
    dot: "bg-gray-400",
    pill: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    icon: Timer,
  },
};

export function getStatusConfig(status: string) {
  return statusConfig[status as OrderStatusKey] ?? {
    label: status,
    color: "text-gray-500",
    fill: "#6b7280",
    bg: "bg-gray-50 dark:bg-gray-950/30",
    dot: "bg-gray-400",
    pill: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    icon: Clock,
  };
}
