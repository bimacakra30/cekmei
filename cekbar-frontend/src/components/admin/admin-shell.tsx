import { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />

      <div className="min-h-screen flex flex-col lg:ml-[250px]">
        <AdminTopbar
          onMenuClick={() => setSidebarOpen(true)}
          showMenuOnDesktop={false}
        />

        <main id="main-content" className="flex-1 px-5 sm:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
