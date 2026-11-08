export type AdminNavItem = {
  label: string;
  href: string;
  icon: string;
  superadminOnly?: boolean;
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

export const adminNavigation: AdminNavGroup[] = [
  {
    title: "",
    items: [
      { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
    ],
  },
  {
    title: "MANAJEMEN",
    items: [
      { label: "Layanan", href: "/admin/layanan", icon: "Package" },
      { label: "Pesanan", href: "/admin/pesanan", icon: "ShoppingCart" },
      { label: "Pesanan Manual", href: "/admin/pesanan-manual", icon: "ClipboardList" },
      { label: "Transaksi", href: "/admin/transaksi", icon: "Receipt" },
    ],
  },
  {
    title: "SISTEM",
    items: [
      { label: "Pengguna", href: "/admin/users", icon: "Users", superadminOnly: true },
      { label: "Pengaturan", href: "/admin/pengaturan", icon: "Settings" },
    ],
  },
];

/**
 * Cari judul halaman admin berdasarkan pathname
 */
export function getAdminPageInfo(pathname: string): { title: string; subtitle: string } {
  const pages: Record<string, { title: string; subtitle: string }> = {
    "/admin": { title: "Admin Dashboard", subtitle: "Ringkasan bisnis & aktivitas sistem" },
    "/admin/layanan": { title: "Kelola Layanan", subtitle: "Sinkronisasi & manajemen layanan dari DHRU API" },
    "/admin/pesanan": { title: "Kelola Pesanan", subtitle: "Semua pesanan dari seluruh pengguna" },
    "/admin/pesanan-manual": { title: "Pesanan Manual", subtitle: "Order yang perlu diproses manual (Add Roamer / Unblock IMEI)" },
    "/admin/transaksi": { title: "Riwayat Transaksi", subtitle: "Log keuangan & mutasi saldo" },
    "/admin/users": { title: "Kelola Pengguna", subtitle: "Manajemen akun & role pengguna" },
    "/admin/pengaturan": { title: "Pengaturan", subtitle: "Konfigurasi keamanan sistem" },
  };

  return pages[pathname] || { title: "Admin", subtitle: "" };
}
