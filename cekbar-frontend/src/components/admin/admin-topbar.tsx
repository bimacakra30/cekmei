import { useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdminPageInfo } from "@/lib/admin-navigation";
import { useEffect, useState } from "react";

type AdminTopbarProps = {
  onMenuClick: () => void;
  showMenuOnDesktop?: boolean;
};

export function AdminTopbar({ onMenuClick, showMenuOnDesktop }: AdminTopbarProps) {
  const { pathname } = useLocation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pageInfo = getAdminPageInfo(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between gap-4 px-5 sm:px-7 h-16">

        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onMenuClick}
            aria-label="Toggle menu"
            className={cn(
              "p-2 rounded-xl hover:bg-muted/80 transition-all text-muted-foreground hover:text-foreground",
              showMenuOnDesktop ? "" : "lg:hidden"
            )}
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate tracking-tight">
              {pageInfo.title}
            </h1>
            {pageInfo.subtitle && (
              <p className="text-[11px] text-muted-foreground truncate leading-tight hidden sm:block">
                {pageInfo.subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button aria-label="Cari" className="hidden md:flex p-2 rounded-xl hover:bg-muted/80 transition-all text-muted-foreground hover:text-foreground">
            <Search size={17} />
          </button>

          <button aria-label="Notifikasi" className="relative p-2 rounded-xl hover:bg-muted/80 transition-all text-muted-foreground hover:text-foreground">
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 border border-background" />
          </button>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle dark mode"
            className="p-2 rounded-xl hover:bg-muted/80 transition-all text-muted-foreground hover:text-foreground"
          >
            {mounted ? (
              theme === "dark"
                ? <Sun size={17} className="text-amber-400" />
                : <Moon size={17} />
            ) : (
              <Moon size={17} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
