import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import type { Service } from "@/types";

type ServiceCardProps = {
  service: Service;
};

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Link to={`/layanan/${service.id}`}
      className="group bg-card rounded-2xl border border-border p-5 flex flex-col gap-4 relative overflow-hidden card-hover"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at top left, ${service.iconColor}08, transparent 60%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative flex items-center justify-between">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${service.iconColor}22, ${service.iconColor}11)`,
            border: `1px solid ${service.iconColor}30`,
          }}
        >
          <DynamicIcon
            name={service.icon}
            size={20}
            className="shrink-0"
            style={{ color: service.iconColor }}
          />
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            Online
          </span>
        </div>
      </div>

      <div className="relative flex-1 min-w-0">
        <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {service.name}
        </h3>
        {service.processTime && (
          <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
            Proses {service.processTime}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
          {service.description}
        </p>
      </div>

      <div className="relative flex items-center justify-end">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-[-4px] group-hover:translate-x-0">
          Pesan
          <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}
