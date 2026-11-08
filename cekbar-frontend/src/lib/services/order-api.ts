import type { Order, OrderStatus } from "@/types";

/**
 * Ambil semua pesanan user yang login
 */
export async function getOrders(): Promise<Order[]> {
  try {
    const res = await fetch("/api/orders", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.orders ?? []).map((row: {
      orderId: string;
      serviceId: string;
      serviceName: string;
      imeiList: string[];
      totalPrice: number;
      status: string;
      paymentId?: string;
      paymentType?: string;
      results?: { imei: string; status: string; detail?: string }[];
      createdAt: string;
    }) => ({
      orderId: row.orderId,
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      imeiList: row.imeiList,
      totalPrice: row.totalPrice,
      paymentMethod: "GOPAY_QRIS" as const,
      status: row.status as OrderStatus,
      results: row.results ?? undefined,
      createdAt: typeof row.createdAt === "string" ? row.createdAt : new Date(row.createdAt).toISOString(),
    }));
  } catch {
    return [];
  }
}

/**
 * Ambil pesanan berdasarkan kategori layanan
 */
export async function getOrdersByServiceCategory(
  serviceCategory: "CEIR" | "UNLOCK_IMEI" | "GSM"
): Promise<Order[]> {
  const all = await getOrders();
  const categoryServiceMap: Record<string, string[]> = {
    CEIR: ["cek-imei-status", "cek-device-history", "cek-validity-roamer", "cek-imei-bea-cukai"],
    UNLOCK_IMEI: ["add-roamer-1-bulan", "add-roamer-3-bulan"],
    GSM: ["apple-carrier-simlock", "pembuatan-icloud"],
  };
  const serviceIds = categoryServiceMap[serviceCategory] || [];
  return all.filter((o) => serviceIds.includes(o.serviceId));
}

/**
 * Buat pesanan baru → return orderId + paymentId + QRIS data
 */
export async function placeOrder(params: {
  serviceId: string;
  serviceName: string;
  imeiList: string[];
  pricePerUnit: number;
}): Promise<Order & { paymentId?: string; qrisId?: string; trxId?: string; qrImage?: string; fee?: number; totalAmount?: number; expiresAt?: string; isDirectOrder?: boolean; results?: unknown; ceirOrderId?: string }> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.error ?? "Gagal membuat order") as Error & { errorCode?: string };
    error.errorCode = err.errorCode;
    throw error;
  }

  const data = await res.json();

  // Direct order (reseller) — different response shape
  if (data.isDirectOrder) {
    return {
      orderId: data.orderId,
      serviceId: params.serviceId,
      serviceName: data.serviceName ?? params.serviceName,
      imeiList: params.imeiList,
      totalPrice: data.totalPrice,
      paymentMethod: "GOPAY_QRIS" as const,
      status: (data.status ?? "PENDING") as OrderStatus,
      results: data.results ?? undefined,
      createdAt: new Date().toISOString(),
      isDirectOrder: true,
      ceirOrderId: data.ceirOrderId ?? undefined,
    };
  }

  // Regular user order — QRIS payment flow
  return {
    orderId: data.orderId,
    serviceId: params.serviceId,
    serviceName: params.serviceName,
    imeiList: params.imeiList,
    totalPrice: data.totalPrice,
    paymentMethod: "GOPAY_QRIS" as const,
    status: "PENDING_PAYMENT" as OrderStatus,
    createdAt: new Date().toISOString(),
    paymentId: data.paymentId,
    qrisId: data.qrisId,
    trxId: data.trxId,
    qrImage: data.qrImage,
    fee: data.fee,
    totalAmount: data.totalAmount,
    expiresAt: data.expiresAt,
  };
}

/**
 * Statistik pesanan untuk dashboard
 */
export async function getOrderStats(): Promise<{ total: number; pending: number; failed: number }> {
  const orders = await getOrders();
  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING" || o.status === "PROCESSING" || o.status === "PENDING_PAYMENT").length,
    failed: orders.filter((o) => o.status === "FAILED").length,
  };
}

/**
 * Ambil detail satu order
 */
export async function getOrderDetail(orderId: string): Promise<Order | null> {
  const orders = await getOrders();
  return orders.find((o) => o.orderId === orderId) ?? null;
}

/**
 * Cek status order (untuk polling)
 */
export async function checkOrderStatus(orderId: string): Promise<{ status: OrderStatus; results?: Order["results"] } | null> {
  const order = await getOrderDetail(orderId);
  if (!order) return null;
  return { status: order.status, results: order.results };
}
