import { Shield, Wrench, Loader2, Check } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export default function AdminPengaturanPage() {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);
  const [savingMaintenance, setSavingMaintenance] = useState(false);

  const [rateLimit, setRateLimit] = useState("30");
  const [maxImei, setMaxImei] = useState("50");
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const fetchMaintenance = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/maintenance");
      if (res.ok) {
        const data = await res.json();
        setMaintenanceEnabled(!!data.enabled);
      }
    } catch {
    } finally {
      setLoadingMaintenance(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        const s = data.settings ?? {};
        if (s.rate_limit) setRateLimit(s.rate_limit);
        if (s.max_imei_per_order) setMaxImei(s.max_imei_per_order);
      }
    } catch {
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchMaintenance();
    fetchSettings();
  }, [fetchMaintenance, fetchSettings]);

  const handleToggleMaintenance = async () => {
    setSavingMaintenance(true);
    const newValue = !maintenanceEnabled;
    try {
      const res = await fetch("/api/settings/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newValue }),
      });
      if (res.ok) {
        setMaintenanceEnabled(newValue);
      }
    } catch {
    } finally {
      setSavingMaintenance(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            rate_limit: rateLimit,
            max_imei_per_order: maxImei,
          },
        }),
      });
      if (res.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2000);
      }
    } catch {
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Tampilan</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola tampilan dan aksesibilitas halaman pengguna
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">Mode Maintenance</p>
                {maintenanceEnabled && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                    AKTIF
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Saat aktif, halaman utama (/) akan dialihkan ke halaman maintenance.
                Admin tetap bisa mengakses panel.
              </p>
              {maintenanceEnabled && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
                  ⚠️ Pengguna saat ini tidak dapat mengakses layanan
                </p>
              )}
            </div>

            <button
              id="toggle-maintenance"
              onClick={handleToggleMaintenance}
              disabled={loadingMaintenance || savingMaintenance}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
                "transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:outline-none",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                maintenanceEnabled
                  ? "bg-amber-500"
                  : "bg-muted"
              )}
              role="switch"
              aria-checked={maintenanceEnabled}
              aria-label="Toggle maintenance mode"
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg",
                  "ring-0 transition duration-200 ease-in-out",
                  "flex items-center justify-center",
                  maintenanceEnabled ? "translate-x-5" : "translate-x-0"
                )}
              >
                {savingMaintenance && (
                  <Loader2 size={10} className="animate-spin text-amber-500" />
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Keamanan</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Konfigurasi keamanan dan pembatasan akses sistem
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Rate Limiting</p>
              <p className="text-xs text-muted-foreground mt-0.5">Batasi jumlah request per user per menit</p>
            </div>
            <input
              type="number"
              min={1}
              max={1000}
              value={loadingSettings ? "" : rateLimit}
              onChange={(e) => setRateLimit(e.target.value)}
              disabled={loadingSettings}
              className="w-20 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-center disabled:opacity-50"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Max IMEI per Order</p>
              <p className="text-xs text-muted-foreground mt-0.5">Batas maksimal IMEI yang bisa disubmit dalam satu pesanan</p>
            </div>
            <input
              type="number"
              min={1}
              max={500}
              value={loadingSettings ? "" : maxImei}
              onChange={(e) => setMaxImei(e.target.value)}
              disabled={loadingSettings}
              className="w-20 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-center disabled:opacity-50"
            />
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-border">
            {settingsSaved && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mr-3 animate-fade-in">
                <Check size={14} />
                Tersimpan
              </span>
            )}
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings || loadingSettings}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white gradient-brand rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {savingSettings && <Loader2 size={14} className="animate-spin" />}
              Simpan Pengaturan
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
