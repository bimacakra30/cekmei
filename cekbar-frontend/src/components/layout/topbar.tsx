import { useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPageInfo } from "@/lib/navigation";
import { useEffect, useState } from "react";

type TopbarProps = {
  onMenuClick: () => void;
  showMenuOnDesktop?: boolean;
};

export function Topbar({ onMenuClick, showMenuOnDesktop }: TopbarProps) {
  const { pathname } = useLocation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pageInfo = getPageInfo(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 h-16 bg-background/95 backdrop-blur-md border-b border-border">

      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className={cn(
            "p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground",
            showMenuOnDesktop ? "" : "lg:hidden"
          )}
          aria-label="Toggle menu"
        >
          <Menu size={19} />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5 hidden sm:flex">
            <span>Cekbar</span>
            <span>/</span>
            <span className="text-foreground font-medium">{pageInfo.title}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-foreground truncate leading-tight">
            {pageInfo.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Toggle dark mode"
        >
          {mounted ? (
            theme === "dark" ? (
              <Sun size={17} className="text-amber-400" />
            ) : (
              <Moon size={17} />
            )
          ) : (
            <Moon size={17} />
          )}
        </button>
      </div>
    </header>
  );
}
