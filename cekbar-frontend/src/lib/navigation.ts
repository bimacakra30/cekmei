export type NavItem = {
  label: string;
  href: string;
  icon: string;
  showOnlineStatus?: boolean;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const navigation: NavGroup[] = [
  {
    title: "",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    ],
  },
  {
    title: "PESAN LAYANAN",
    items: [
      { label: "Cek IMEI", href: "/layanan/cek-imei", icon: "Search", showOnlineStatus: true },
      { label: "Unblock IMEI", href: "/layanan/unblock-imei", icon: "Smartphone", showOnlineStatus: true },
      { label: "GSM Service", href: "/layanan/gsm-service", icon: "Laptop", showOnlineStatus: true },
    ],
  },
  {
    title: "RIWAYAT PESANAN",
    items: [
      { label: "Riwayat Pesanan CEIR", href: "/riwayat/pesanan-ceir", icon: "History" },
      { label: "Riwayat Pesanan GSM", href: "/riwayat/pesanan-gsm", icon: "History" },
      { label: "Riwayat Add Roamer", href: "/riwayat/add-roamer", icon: "History" },
    ],
  },
];

/**
 * Cari judul halaman berdasarkan pathname
 */
export function getPageInfo(pathname: string): { title: string; subtitle: string } {
  for (const group of navigation) {
    for (const item of group.items) {
      if (item.href === pathname) {
        return {
          title: item.label.split("\n")[0],
          subtitle: getSubtitle(pathname),
        };
      }
    }
  }

  if (pathname.startsWith("/pembayaran/")) {
    return { title: "Detail Pembayaran", subtitle: "Pembayaran via QRIS GoPay" };
  }

  if (pathname.startsWith("/layanan/")) {
    const slug = pathname.split("/").pop() || "";
    const subtitleVal = getSubtitle(`/layanan/${slug}`);
    const titleFallback = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return { title: titleFallback, subtitle: subtitleVal || "" };
  }

  if (pathname === "/syarat-ketentuan") {
    return { title: "Syarat & Ketentuan", subtitle: "Aturan dan ketentuan layanan Add Roamer" };
  }

  return { title: "Dashboard", subtitle: "Selamat datang kembali!" };
}

function getSubtitle(pathname: string): string {
  const subtitles: Record<string, string> = {
    "/dashboard": "Selamat datang kembali!",
    "/layanan/cek-imei": "Periksa status IMEI perangkat Anda di database CEIR",
    "/layanan/unblock-imei": "Tambahkan IMEI ke sistem Roamer / Unblock IMEI",
    "/layanan/gsm-service": "Layanan GSM seperti cek carrier, iCloud, dsb",
    "/riwayat/pesanan-ceir": "Semua riwayat pesanan layanan CEIR",
    "/riwayat/pesanan-gsm": "Semua riwayat pesanan layanan GSM",
    "/riwayat/add-roamer": "Semua riwayat pesanan Add Roamer",
  };
  return subtitles[pathname] || "";
}
