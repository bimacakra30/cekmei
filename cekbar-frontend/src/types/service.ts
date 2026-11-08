export type ServiceCategory = "CEIR" | "UNLOCK_IMEI" | "GSM";

export type Service = {
  id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  icon: string;
  iconColor: string;
  isOnline: boolean;
  pricePerUnit: number;
  requiresAgreement: boolean;
  processTime?: string;
  bannerInfo?: string;
  inputLabel: string;
  submitLabel: string;
  subtitle: string;
};
