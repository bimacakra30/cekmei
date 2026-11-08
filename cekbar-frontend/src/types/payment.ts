export type PaymentStatus = "MENUNGGU" | "LUNAS" | "KADALUARSA" | "GAGAL";

export type Payment = {
    paymentId: string;
    orderId: string;
    serviceName: string;
    amount: number;
    fee: number;
    totalAmount: number;
    method: "GOPAY_QRIS";
    status: PaymentStatus;
    createdAt: string;
    paidAt?: string;
    expiresAt?: string;
    qrisId?: string;
    trxId?: string;
    qrImage?: string;
    qrisUrl?: string;
    gopayTransactionId?: string;
    payerIssuer?: string;
    paymentType?: string;
};
