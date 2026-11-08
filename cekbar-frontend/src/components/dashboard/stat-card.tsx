import { DynamicIcon } from "@/components/ui/dynamic-icon";

type StatCardProps = {
  icon: string;
  iconColor: string;
  iconBg: string;
  value: number | string;
  label: string;
  trend?: string;
};

export function StatCard({ icon, iconColor, iconBg, value, label, trend }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">
            {label}
          </p>
          <p className="text-2xl font-bold text-foreground tracking-tight">
            {typeof value === "number" ? value.toLocaleString("id-ID") : value}
          </p>
          {trend && (
            <p className="text-xs text-muted-foreground mt-1">{trend}</p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <DynamicIcon name={icon} size={20} className="shrink-0" style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}
