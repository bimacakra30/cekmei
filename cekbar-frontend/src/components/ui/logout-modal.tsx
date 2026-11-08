import { useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, X } from "lucide-react";

export function useLogoutModal() {
  const [open, setOpen] = useState(false);
  return { open, show: () => setOpen(true), hide: () => setOpen(false) };
}

export function LogoutModal({ open, onCancel, onConfirm, loading }: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm animate-fade-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <LogOut size={22} className="text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Keluar dari Akun?</h3>
          <p className="text-sm text-muted-foreground mt-1.5">
            Anda perlu login kembali untuk mengakses dashboard.
          </p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            {loading ? "Keluar..." : "Ya, Keluar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

