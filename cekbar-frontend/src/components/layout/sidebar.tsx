import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { X, ChevronDown, User, LogOut } from "lucide-react";
import { CekbarLogo } from "@/components/ui/cekbar-logo";
import { cn } from "@/lib/utils";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LogoutModal, useLogoutModal } from "@/components/ui/logout-modal";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

type DbService = {
  id: number;
  service_id: string;
  service_name: string;
  group_name: string;
  category: string | null;
  sell_price: number;
  time_info: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: string;
  showOnlineStatus?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const staticNavBefore: NavGroup[] = [
  {
    title: "",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    ],
  },
];

const staticNavAfter: NavGroup[] = [
  {
    title: "RIWAYAT PESANAN",
    items: [
      { label: "Riwayat Pesanan CEIR", href: "/riwayat/pesanan-ceir", icon: "History" },
      { label: "Riwayat Add Roamer", href: "/riwayat/add-roamer", icon: "History" },
    ],
  },
];

function getServiceIcon(serviceName: string, groupName: string): string {
  const name = serviceName.toLowerCase();
  const group = groupName.toLowerCase();
  if (name.includes("check") || name.includes("cek") || name.includes("status")) return "Search";
  if (name.includes("history") || name.includes("riwayat")) return "Zap";
  if (name.includes("validity") || name.includes("roamer") && name.includes("cek")) return "Globe";
  if (name.includes("bea cukai")) return "Shield";
  if (name.includes("roamer") && name.includes("1")) return "Smartphone";
  if (name.includes("roamer") && name.includes("3")) return "TabletSmartphone";
  if (name.includes("apple") || name.includes("carrier") || name.includes("simlock")) return "Laptop";
  if (name.includes("icloud") || name.includes("cloud")) return "Cloud";
  if (group.includes("unlock")) return "Smartphone";
  if (group.includes("gsm")) return "Laptop";
  return "Package";
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<number, boolean>>({});
  const [dynamicNav, setDynamicNav] = useState<NavGroup[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { user } = useAuth();
  const logoutModal = useLogoutModal();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    navigate("/login");
  }

  const toggleGroup = (idx: number) => {
    setCollapsedGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  useEffect(() => {
    const CACHE_KEY = "sidebar_services";
    const CACHE_TTL = 5 * 60 * 1000;

    async function fetchServices() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data: cachedGroups, ts } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL) {
            setDynamicNav(cachedGroups);
            setLoaded(true);
            return;
          }
        }

        const res = await fetch("/api/services");
        const data = await res.json();
        if (res.ok && data.services?.length > 0) {

          const grouped: Record<string, DbService[]> = {};
          for (const svc of data.services) {
            if (!grouped[svc.group_name]) grouped[svc.group_name] = [];
            grouped[svc.group_name].push(svc);
          }

          const categoryLabels: Record<string, string> = {
            "cek-imei": "Cek IMEI",
            "unblock-imei": "Unblock IMEI",
            "gsm-service": "GSM Service",
          };

          const groups: NavGroup[] = Object.entries(grouped).map(([groupName, services]) => {
            const seenCategories = new Set<string>();
            const items: NavItem[] = [];

            for (const svc of services) {
              if (svc.category && !seenCategories.has(svc.category)) {
                seenCategories.add(svc.category);

                const catCount = services.filter(s => s.category === svc.category).length;
                const catLabel = categoryLabels[svc.category] || svc.category;
                items.push({
                  label: catCount > 1 ? `${catLabel}\n(${catCount} layanan)` : catLabel,
                  href: `/layanan/${svc.category}`,
                  icon: getServiceIcon(svc.service_name, groupName),
                  showOnlineStatus: true,
                });
              }

            }

            return {
              title: groupName.toUpperCase(),
              items,
            };
          }).filter(group => group.items.length > 0);
          setDynamicNav(groups);

          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: groups, ts: Date.now() }));
          } catch {}
        }
      } catch {
      } finally {
        setLoaded(true);
      }
    }
    fetchServices();
  }, []);

  const navigation: NavGroup[] = [...staticNavBefore, ...dynamicNav, ...staticNavAfter];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-screen z-50 flex flex-col w-[260px]",
          "transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:z-30",
          "bg-white dark:bg-[#0f172a]",
          "border-r border-border/60",
        )}
      >

        <div className="flex items-center justify-between px-5 h-[68px] shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
            <CekbarLogo size="sm" subtitle="Member Area" />
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="mx-5 h-px bg-border/60" />

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-0.5 min-h-0">
          {!loaded && dynamicNav.length === 0 ? (
            <>
              <div className="space-y-1 px-1">
                <div className="h-9 bg-muted rounded-xl animate-pulse" />
                <div className="mt-4 space-y-2">
                  <div className="h-2.5 w-24 bg-muted rounded animate-pulse" />
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-9 bg-muted/60 rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
            </>
          ) : (
            navigation.map((group, groupIdx) => {
              const isGroupCollapsed = collapsedGroups[groupIdx] ?? false;
              return (
                <div key={groupIdx} className={cn(groupIdx > 0 && "mt-5")}>
                  {group.title ? (
                    <button
                      onClick={() => toggleGroup(groupIdx)}
                      aria-expanded={!isGroupCollapsed}
                      className="w-full flex items-center justify-between px-3 mb-2"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 select-none">
                        {group.title}
                      </span>
                      <ChevronDown
                        size={11}
                        className={cn(
                          "text-muted-foreground/40 transition-transform duration-200",
                          isGroupCollapsed && "-rotate-90"
                        )}
                      />
                    </button>
                  ) : null}

                  <div
                    className={cn(
                      "space-y-0.5 overflow-hidden transition-all duration-200 ease-in-out",
                      group.title && isGroupCollapsed
                        ? "max-h-0 opacity-0"
                        : "max-h-[700px] opacity-100"
                    )}
                  >
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      const labelLines = item.label.split("\n");

                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={onClose}
                          className={cn(
                            "relative group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                            isActive
                              ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                          )}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-500" />
                          )}

                          <DynamicIcon
                            name={item.icon}
                            size={16}
                            className={cn(
                              "shrink-0 transition-colors",
                              isActive
                                ? "text-blue-500 dark:text-blue-400"
                                : "text-muted-foreground/60 group-hover:text-muted-foreground"
                            )}
                          />

                          <span className="flex-1 min-w-0">
                            <span className="block leading-snug truncate">{labelLines[0]}</span>
                            {labelLines[1] && (
                              <span className="block text-[11px] leading-snug mt-0.5 text-muted-foreground/60 truncate">
                                {labelLines[1]}
                              </span>
                            )}
                          </span>

                          {item.showOnlineStatus && (
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </nav>

        <div className="px-3 shrink-0">
          <div className="h-px bg-border/40 mb-1" />
          {user && (
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
              >
                <span suppressHydrationWarning>{user.username.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-foreground truncate" suppressHydrationWarning>
                  {user.username}
                </p>
                <p className="text-[11px] text-muted-foreground truncate" suppressHydrationWarning>
                  {user.email}
                </p>
              </div>
            </div>
          )}
          <Link to="/profil"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
              pathname === "/profil"
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <User size={16} className="shrink-0" />
            Profil Saya
          </Link>
          <button
            onClick={logoutModal.show}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
          >
            <LogOut size={16} className="shrink-0" />
            Keluar
          </button>
        </div>

        <div className="px-5 py-3 shrink-0">
          <p className="text-[10px] text-muted-foreground/40 font-medium">
            Cekbar v1.0 — Phase 1
          </p>
        </div>
      </aside>

      <LogoutModal
        open={logoutModal.open}
        onCancel={logoutModal.hide}
        onConfirm={handleLogout}
        loading={loggingOut}
      />
    </>
  );
}
