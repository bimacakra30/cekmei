import { createPortal } from "react-dom";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";

type DeleteConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
  message: React.ReactNode;
};

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, deleting, message }: DeleteConfirmModalProps) {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !deleting) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 animate-fade-in">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 mx-auto mb-4">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <h3 className="text-center text-lg font-bold text-foreground mb-1">Hapus Layanan?</h3>
        <p className="text-center text-sm text-muted-foreground mb-5">
          {message}
        </p>
        <div className="flex items-center gap-3">
          <button onClick={() => !deleting && onClose()} disabled={deleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50">
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-60"
          >
            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            {deleting ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
