import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

import { AuthLayout } from "@/layouts/AuthLayout";
import { MainLayout } from "@/layouts/MainLayout";
import { AdminLayout } from "@/layouts/AdminLayout";

const HomePage = lazy(() => import("@/pages/HomePage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const MaintenancePage = lazy(() => import("@/pages/MaintenancePage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));

const DashboardPage = lazy(() => import("@/pages/main/DashboardPage"));
const ProfilePage = lazy(() => import("@/pages/main/ProfilePage"));
const PaymentPage = lazy(() => import("@/pages/main/PaymentPage"));
const TermsPage = lazy(() => import("@/pages/main/TermsPage"));
const ServiceCategoryPage = lazy(() => import("@/pages/main/ServiceCategoryPage"));
const HistoryCeirPage = lazy(() => import("@/pages/main/HistoryCeirPage"));
const HistoryGsmPage = lazy(() => import("@/pages/main/HistoryGsmPage"));
const AddRoamerPage = lazy(() => import("@/pages/main/AddRoamerPage"));

const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminServicesPage = lazy(() => import("@/pages/admin/AdminServicesPage"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/AdminOrdersPage"));
const AdminManualOrderPage = lazy(() => import("@/pages/admin/AdminManualOrderPage"));
const AdminTransactionsPage = lazy(() => import("@/pages/admin/AdminTransactionsPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/AdminSettingsPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-brand-primary" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/kontak" element={<ContactPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/lupa-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/pembayaran/:paymentId" element={<PaymentPage />} />
          <Route path="/syarat-ketentuan" element={<TermsPage />} />
          <Route path="/layanan/:categorySlug" element={<ServiceCategoryPage />} />
          <Route path="/riwayat/pesanan-ceir" element={<HistoryCeirPage />} />
          <Route path="/riwayat/pesanan-gsm" element={<HistoryGsmPage />} />
          <Route path="/riwayat/add-roamer" element={<AddRoamerPage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="layanan" element={<AdminServicesPage />} />
          <Route path="pesanan" element={<AdminOrdersPage />} />
          <Route path="pesanan-manual" element={<AdminManualOrderPage />} />
          <Route path="transaksi" element={<AdminTransactionsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="pengaturan" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
