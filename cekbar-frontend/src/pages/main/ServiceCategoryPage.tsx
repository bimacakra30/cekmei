import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ServiceOrderPage } from "@/components/service-order/service-order-page";
import type { Service } from "@/types";

type DbService = {
  id: number;
  service_id: string;
  service_name: string;
  group_name: string;
  category: string | null;
  sell_price: number;
  time_info: string;
  info: string | null;
  min_qty: number;
  max_qty: string;
  custom_field_name: string;
  custom_field_regex: string;
  custom_field_maxlen: string;
  allow_bulk: number;
  is_active: boolean;
};

const CATEGORY_CONFIG: Record<string, {
  label: string;
  breadcrumb: string;
  requiresAgreement: boolean;
  bannerInfo?: string;
}> = {
  "cek-imei": {
    label: "Cek IMEI",
    breadcrumb: "CEK IMEI",
    requiresAgreement: false,
    bannerInfo: "Layanan pengecekan IMEI. Pastikan IMEI yang dimasukkan valid (15 digit).",
  },
  "unblock-imei": {
    label: "Unblock IMEI",
    breadcrumb: "UNBLOCK IMEI",
    requiresAgreement: true,
    bannerInfo: "Penting: Dengan melanjutkan pemesanan, Anda dianggap telah membaca dan menyetujui Syarat & Ketentuan kami.",
  },
  "gsm-service": {
    label: "GSM Service",
    breadcrumb: "LAYANAN GSM",
    requiresAgreement: false,
    bannerInfo: "Layanan GSM. Proses akan berjalan otomatis setelah pesanan dikonfirmasi.",
  },
};

function serviceIdToSlug(serviceId: string): string {
  return serviceId
    .replace(/^\//, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function dbServiceToService(dbSvc: DbService, categorySlug: string): Service {
  const config = CATEGORY_CONFIG[categorySlug];
  const isCeir = categorySlug === "cek-imei";

  return {
    id: serviceIdToSlug(dbSvc.service_id),
    category: isCeir ? "CEIR" : categorySlug === "unblock-imei" ? "UNLOCK_IMEI" : "GSM",
    name: dbSvc.service_name,
    description: dbSvc.service_name,
    icon: "Package",
    iconColor: "#3B82F6",
    isOnline: dbSvc.is_active,
    pricePerUnit: dbSvc.sell_price,
    requiresAgreement: config?.requiresAgreement ?? false,
    processTime: dbSvc.time_info || undefined,
    bannerInfo: config?.bannerInfo,
    inputLabel: dbSvc.custom_field_name || "Input IMEI Perangkat",
    submitLabel: config?.requiresAgreement
      ? `Submit Pesanan`
      : `Cek Sekarang`,
    subtitle: dbSvc.time_info || dbSvc.service_name,
  };
}

export default function ServiceCategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const config = categorySlug ? CATEGORY_CONFIG[categorySlug] : undefined;

  useEffect(() => {
    if (!categorySlug || !config) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setServices([]);
    setLoading(true);
    setNotFound(false);

    async function fetchData() {
      try {
        const res = await fetch(`/api/services?category=${categorySlug}`);
        const data = await res.json();

        if (res.ok && data.services?.length > 0) {
          const mapped = data.services.map((svc: DbService) =>
            dbServiceToService(svc, categorySlug!)
          );
          setServices(mapped);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [categorySlug, config]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Memuat layanan...</p>
      </div>
    );
  }

  if (notFound || services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-semibold text-foreground mb-2">Layanan Tidak Tersedia</p>
        <p className="text-sm text-muted-foreground">
          Belum ada layanan aktif untuk kategori ini. Hubungi admin untuk mengaktifkan.
        </p>
      </div>
    );
  }

  return (
    <ServiceOrderPage
      services={services}
      categorySlug={categorySlug!}
      categoryLabel={config?.breadcrumb ?? categorySlug!.toUpperCase()}
    />
  );
}
