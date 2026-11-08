import type { Payment, PaymentStatus } from "@/types";

export async function getPaymentDetail(paymentId: string): Promise<Payment | null> {
  try {
    const res = await fetch(`/api/payments/${paymentId}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();

    return {
      paymentId: data.paymentId,
      orderId: data.orderId,
      serviceName: data.serviceName,
      amount: data.amount,
      fee: data.fee,
      totalAmount: data.totalAmount,
      method: "GOPAY_QRIS",
      status: data.status as PaymentStatus,
      createdAt: data.createdAt,
      paidAt: data.confirmedAt ?? undefined,
      expiresAt: data.expiresAt ?? undefined,
      qrisId: data.qrisId ?? undefined,
      trxId: data.trxId ?? undefined,
      qrImage: data.qrImage ?? undefined,
      qrisUrl: data.qrisUrl ?? undefined,
      gopayTransactionId: data.gopayTransactionId ?? undefined,
      payerIssuer: data.payerIssuer ?? undefined,
      paymentType: data.paymentType ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function checkPaymentStatus(paymentId: string): Promise<{
  status: PaymentStatus;
  paidAt?: string;
} | null> {
  const payment = await getPaymentDetail(paymentId);
  if (!payment) return null;
  return {
    status: payment.status,
    paidAt: payment.paidAt,
  };
}
