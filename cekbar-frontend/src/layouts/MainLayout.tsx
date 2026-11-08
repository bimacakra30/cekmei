import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";

export function MainLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

