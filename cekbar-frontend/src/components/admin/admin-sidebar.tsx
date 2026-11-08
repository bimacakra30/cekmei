import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { X, User, LogOut } from "lucide-react";
import { CekbarLogo } from "@/components/ui/cekbar-logo";
import { cn } from "@/lib/utils";
import { adminNavigation } from "@/lib/admin-navigation";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { useAuth } from "@/hooks/use-auth";
import { LogoutModal, useLogoutModal } from "@/components/ui/logout-modal";

type AdminSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";
  const isSuperadmin = user?.role === "superadmin";
  const logoutModal = useLogoutModal();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    navigate("/login");
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-screen z-50 flex flex-col w-[250px]",
          "transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:z-30",
          "bg-white dark:bg-[#0f172a]",
          "border-r border-border/60",
        )}
      >
        <div className="flex items-center justify-between px-5 h-[68px] shrink-0">
          <Link to="/admin" className="flex items-center gap-3 group" onClick={onClose}>
            <CekbarLogo size="sm" subtitle="Admin Panel" />
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
          {adminNavigation.map((group, groupIdx) => (
            <div key={groupIdx} className={cn(groupIdx > 0 && "mt-5")}>
              {group.title && (
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                  {group.title}
                </p>
              )}

              {group.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href + "/"));

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
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
                      size={17}
                      className={cn(
                        "shrink-0 transition-colors duration-200",
                        isActive
                          ? "text-blue-500 dark:text-blue-400"
                          : "text-muted-foreground/60 group-hover:text-muted-foreground"
                      )}
                    />
                    <span className="flex-1 min-w-0 truncate">{item.label}</span>
                    {item.superadminOnly && (
                      <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15">
                        SA
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="px-3 shrink-0">
          <div className="h-px bg-border/40 mb-1" />
          {user && (
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white text-[11px] font-bold shadow-sm",
                isSuperadmin
                  ? "bg-gradient-to-br from-amber-500 to-orange-600"
                  : "bg-gradient-to-br from-blue-500 to-indigo-600"
              )}>
                <span suppressHydrationWarning>{initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-foreground truncate" suppressHydrationWarning>
                  {user.username}
                </p>
                <p className={cn(
                  "text-[10px] font-semibold truncate",
                  isSuperadmin ? "text-amber-500" : "text-blue-500"
                )} suppressHydrationWarning>
                  {isSuperadmin ? "Superadmin" : "Admin"}
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
            © 2026 Cekbar
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
