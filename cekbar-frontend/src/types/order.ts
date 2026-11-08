export type OrderStatus = "PENDING_PAYMENT" | "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "EXPIRED";

export type OrderResult = {
  imei: string;
  status: string;
  detail?: string;
};

export type Order = {
  orderId: string;
  serviceId: string;
  serviceName: string;
  imeiList: string[];
  totalPrice: number;
  paymentMethod: "GOPAY_QRIS";
  status: OrderStatus;
  createdAt: string;
  results?: OrderResult[];
};
