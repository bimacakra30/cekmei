import { X, Check, Loader2, AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";
import { formatRupiah } from "@/lib/utils";

type ServiceForm = {
  service_id: string;
  service_name: string;
  group_name: string;
  category: string;
  buy_price: string;
  sell_price: string;
  time_info: string;
  info: string;
  is_active: boolean;
};

type ServiceFormDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  form: ServiceForm;
  setField: <K extends keyof ServiceForm>(key: K, value: ServiceForm[K]) => void;
  onSubmit: () => void;
  saving: boolean;
  formError: string | null;
  groups: string[];
  groupInputMode: "select" | "custom";
  setGroupInputMode: (mode: "select" | "custom") => void;
  categoryOptions: readonly { value: string | null; label: string }[];
  drawerServiceId?: string;
};

export function ServiceFormDrawer({
  isOpen,
  onClose,
  mode,
  form,
  setField,
  onSubmit,
  saving,
  formError,
  groups,
  groupInputMode,
  setGroupInputMode,
  categoryOptions,
  drawerServiceId,
}: ServiceFormDrawerProps) {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />
      <div className="relative ml-auto h-full w-full max-w-lg bg-card border-l border-border shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {mode === "add" ? "Tambah Layanan" : "Edit Layanan"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mode === "add" ? "Tambah layanan secara manual" : `ID: ${drawerServiceId}`}
            </p>
          </div>
          <button onClick={() => !saving && onClose()} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {formError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              <AlertTriangle size={15} className="shrink-0" />
              {formError}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Service ID / Endpoint
              </label>
              {mode === "edit" && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                  read-only
                </span>
              )}
            </div>
            {mode === "add" ? (
              <>
                <input
                  type="text"
                  value={form.service_id}
                  onChange={e => setField("service_id", e.target.value)}
                  placeholder="Kosongkan untuk auto-generate..."
                  className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary font-mono transition-colors"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  ID unik layanan ini dalam sistem. Jika kosong, akan digenerate otomatis.
                </p>
              </>
            ) : (
              <div className="px-3 py-2.5 text-sm bg-muted/40 border border-border rounded-lg font-mono text-foreground select-all cursor-text">
                {form.service_id}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Nama Layanan *</label>
            <input
              type="text"
              value={form.service_name}
              onChange={e => setField("service_name", e.target.value)}
              placeholder="Cek IMEI Bea Cukai..."
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Grup *</label>
              <button
                type="button"
                onClick={() => setGroupInputMode(groupInputMode === "select" ? "custom" : "select")}
                className="text-[11px] text-brand-primary hover:underline"
              >
                {groupInputMode === "select" ? "+ Grup baru" : "Pilih dari daftar"}
              </button>
            </div>
            {groupInputMode === "select" && groups.length > 0 ? (
              <select
                value={form.group_name}
                onChange={e => setField("group_name", e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
              >
                <option value="">— Pilih Grup —</option>
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={form.group_name}
                onChange={e => setField("group_name", e.target.value)}
                placeholder="Nama grup layanan..."
                className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Kategori</label>
            <select
              value={form.category}
              onChange={e => setField("category", e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
            >
              <option value="">— Tidak ada —</option>
              {categoryOptions.filter(o => o.value !== null).map(o => (
                <option key={o.value!} value={o.value!}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-border" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Harga Beli (Rp)</label>
              <input
                type="number"
                min="0"
                value={form.buy_price}
                onChange={e => setField("buy_price", e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Harga Jual (Rp)</label>
              <input
                type="number"
                min="0"
                value={form.sell_price}
                onChange={e => setField("sell_price", e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
              />
            </div>
          </div>
          {Number(form.buy_price) > 0 && Number(form.sell_price) > 0 && (
            <div className={`text-xs font-medium px-3 py-2 rounded-lg ${
              Number(form.sell_price) >= Number(form.buy_price)
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-500"
            }`}>
              Margin: {Number(form.sell_price) >= Number(form.buy_price) ? "+" : ""}
              {formatRupiah(Number(form.sell_price) - Number(form.buy_price))}
              {" "}({Number(form.buy_price) > 0 ? (((Number(form.sell_price) - Number(form.buy_price)) / Number(form.buy_price)) * 100).toFixed(0) : 0}%)
            </div>
          )}

          <div className="border-t border-border" />

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Estimasi Waktu</label>
            <input
              type="text"
              value={form.time_info}
              onChange={e => setField("time_info", e.target.value)}
              placeholder="Contoh: 1-24 jam, Instan..."
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Deskripsi / Info</label>
            <textarea
              value={form.info}
              onChange={e => setField("info", e.target.value)}
              placeholder="Deskripsi layanan, catatan, dll..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-xl">
            <div>
              <p className="text-sm font-medium text-foreground">Status Aktif</p>
              <p className="text-xs text-muted-foreground">Layanan akan tampil untuk pelanggan</p>
            </div>
            <button
              type="button"
              onClick={() => setField("is_active", !form.is_active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-1 ${
                form.is_active ? "bg-emerald-500" : "bg-border"
              }`}
              role="switch"
              aria-checked={form.is_active}
              aria-label="Toggle status aktif"
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                form.is_active ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>

        </div>

        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center gap-3">
          <button
            onClick={() => !saving && onClose()}
            disabled={saving}
            className="flex-1 px-4 py-2.5 text-sm font-medium border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white gradient-brand rounded-xl transition-opacity disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {saving ? "Menyimpan..." : mode === "add" ? "Tambah Layanan" : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
