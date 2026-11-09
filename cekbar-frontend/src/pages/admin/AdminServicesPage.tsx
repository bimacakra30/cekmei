import { formatRupiah } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  X,
  Check,
  Loader2,
  CloudDownload,
  ToggleLeft,
  ToggleRight,
  CheckSquare,
  Square,
  Minus,
  Trash2,
  Plus,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DeleteConfirmModal } from "./delete-confirm-modal";
import { ServiceFormDrawer } from "./service-form-drawer";

interface ServiceRow {
  id: number;
  service_id: string;
  service_name: string;
  group_name: string;
  category: string | null;
  buy_price: number;
  sell_price: number;
  time_info: string;
  info: string;
  is_active: number;
  last_synced_at: string | null;
}

const CATEGORY_OPTIONS = [
  { value: null, label: "Tidak ada" },
  { value: "cek-imei", label: "Cek IMEI" },
  { value: "unblock-imei", label: "Unblock IMEI" },
  { value: "gsm-service", label: "GSM Service" },
] as const;

const EMPTY_FORM = {
  service_id: "",
  service_name: "",
  group_name: "",
  category: "" as string,
  buy_price: "",
  sell_price: "",
  time_info: "",
  info: "",
  is_active: true,
};

export default function AdminLayananPage() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroup, setFilterGroup] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSellPrice, setEditSellPrice] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [autoSynced, setAutoSynced] = useState(false);
  const [lastSyncedInfo, setLastSyncedInfo] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<{ type: "single"; service: ServiceRow } | { type: "batch" } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [drawerMode, setDrawerMode] = useState<"add" | "edit" | null>(null);
  const [drawerService, setDrawerService] = useState<ServiceRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [groupInputMode, setGroupInputMode] = useState<"select" | "custom">("select");

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServices, setTotalServices] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterGroup !== "ALL") params.set("group", filterGroup);
      if (searchQuery) params.set("search", searchQuery);
      params.set("page", String(currentPage));
      params.set("limit", String(perPage));

      const res = await fetch(`/api/admin/services?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setServices(data.services);
        if (data.groups?.length > 0) setGroups(data.groups);
        setTotalServices(data.total ?? data.services.length);
        setActiveCount(data.activeCount ?? 0);
        setInactiveCount(data.inactiveCount ?? 0);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch {
    } finally {
      setLoading(false);
      setSelectedIds(new Set());
    }
  }, [filterGroup, searchQuery, currentPage, perPage]);

  useEffect(() => {
    let cancelled = false;

    async function checkAndSync() {
      try {
        const statusRes = await fetch("/api/admin/services/sync-status");
        const status = await statusRes.json();

        if (status.minutesAgo !== null) {
          if (status.minutesAgo < 1) {
            setLastSyncedInfo("Baru saja");
          } else if (status.minutesAgo < 60) {
            setLastSyncedInfo(`${status.minutesAgo} menit lalu`);
          } else {
            setLastSyncedInfo(`${Math.floor(status.minutesAgo / 60)} jam lalu`);
          }
        }

        if (status.isStale && !cancelled) {
          setAutoSynced(true);
          setSyncing(true);
          setSyncResult(null);

          const syncRes = await fetch("/api/admin/services/sync", { method: "POST" });
          const syncData = await syncRes.json();

          if (!cancelled) {
            if (syncRes.ok) {
              setSyncResult(
                `✓ Auto-sync berhasil — ${syncData.summary.totalFromApi} layanan (${syncData.summary.inserted} baru, ${syncData.summary.updated} diperbarui)`
              );
              setLastSyncedInfo("Baru saja");
            } else {
              setSyncResult(`✗ Auto-sync gagal: ${syncData.error}`);
            }
            setSyncing(false);
            fetchServices();
          }
        } else {
          fetchServices();
        }
      } catch {
        if (!cancelled) {
          fetchServices();
        }
      }
    }

    checkAndSync();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autoSynced || !loading) {
      fetchServices();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterGroup, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterGroup, searchQuery, perPage]);

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/services/sync", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setSyncResult(
          `✓ Sinkron berhasil — ${data.summary.totalFromApi} layanan (${data.summary.inserted} baru, ${data.summary.updated} diperbarui)`
        );
        setLastSyncedInfo("Baru saja");
        fetchServices();
      } else {
        setSyncResult(`✗ ${data.error}`);
      }
    } catch {
      setSyncResult("✗ Gagal terhubung ke server");
    } finally {
      setSyncing(false);
    }
  }

  async function toggleActive(service: ServiceRow) {
    try {
      setSavingId(service.id);
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !service.is_active }),
      });
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === service.id ? { ...s, is_active: s.is_active ? 0 : 1 } : s
          )
        );
      }
    } catch {
    } finally {
      setSavingId(null);
    }
  }

  async function saveSellPrice(service: ServiceRow) {
    const price = Number(editSellPrice);
    if (isNaN(price) || price < 0) return;

    try {
      setSavingId(service.id);
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sell_price: price }),
      });
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === service.id ? { ...s, sell_price: price } : s
          )
        );
        setEditingId(null);
      }
    } catch {
    } finally {
      setSavingId(null);
    }
  }

  const allSelected = services.length > 0 && selectedIds.size === services.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < services.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(services.map((s) => s.id)));
    }
  }

  function toggleSelectOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function batchSetActive(isActive: boolean) {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    try {
      const res = await fetch("/api/admin/services/batch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), is_active: isActive }),
      });
      if (res.ok) {
        const label = isActive ? 1 : 0;
        setServices((prev) =>
          prev.map((s) =>
            selectedIds.has(s.id) ? { ...s, is_active: label } : s
          )
        );
        setSelectedIds(new Set());
        setSyncResult(
          `✓ ${selectedIds.size} layanan berhasil di${isActive ? "aktifkan" : "nonaktifkan"}`
        );
      } else {
        setSyncResult("✗ Gagal update batch layanan");
      }
    } catch {
      setSyncResult("✗ Gagal terhubung ke server");
    } finally {
      setBatchLoading(false);
    }
  }

  async function deleteService(service: ServiceRow) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, { method: "DELETE" });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== service.id));
        setSyncResult(`✓ Layanan "${service.service_name}" berhasil dihapus`);
      } else {
        const data = await res.json();
        setSyncResult(`✗ ${data.error ?? "Gagal menghapus layanan"}`);
      }
    } catch {
      setSyncResult("✗ Gagal terhubung ke server");
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  async function batchDeleteServices() {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    const count = selectedIds.size;
    try {
      const res = await fetch("/api/admin/services/batch", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => !selectedIds.has(s.id)));
        setSelectedIds(new Set());
        setSyncResult(`✓ ${count} layanan berhasil dihapus`);
      } else {
        const data = await res.json();
        setSyncResult(`✗ ${data.error ?? "Gagal menghapus layanan"}`);
      }
    } catch {
      setSyncResult("✗ Gagal terhubung ke server");
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  function openAddDrawer() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setDrawerService(null);
    setGroupInputMode("select");
    setDrawerMode("add");
  }

  function openEditDrawer(service: ServiceRow) {
    setForm({
      service_id: service.service_id,
      service_name: service.service_name,
      group_name: service.group_name,
      category: service.category ?? "",
      buy_price: String(service.buy_price),
      sell_price: String(service.sell_price),
      time_info: service.time_info ?? "",
      info: service.info ?? "",
      is_active: Boolean(service.is_active),
    });
    setFormError(null);
    setDrawerService(service);
    setGroupInputMode(groups.includes(service.group_name) ? "select" : "custom");
    setDrawerMode("edit");
  }

  function closeDrawer() {
    setDrawerMode(null);
    setDrawerService(null);
    setFormError(null);
  }

  function setField<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function createService() {
    if (!form.service_name.trim()) { setFormError("Nama layanan wajib diisi"); return; }
    if (!form.group_name.trim()) { setFormError("Nama grup wajib diisi"); return; }
    setFormSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: form.service_id.trim() || undefined,
          service_name: form.service_name.trim(),
          group_name: form.group_name.trim(),
          category: form.category || null,
          buy_price: Number(form.buy_price) || 0,
          sell_price: Number(form.sell_price) || 0,
          time_info: form.time_info,
          info: form.info,
          is_active: form.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Gagal menyimpan"); return; }
      setServices(prev => [...prev, data.service]);
      if (!groups.includes(data.service.group_name)) {
        setGroups(prev => [...prev, data.service.group_name].sort());
      }
      setSyncResult(`✓ Layanan "${data.service.service_name}" berhasil ditambahkan`);
      closeDrawer();
    } catch {
      setFormError("Gagal terhubung ke server");
    } finally {
      setFormSaving(false);
    }
  }

  async function updateService() {
    if (!drawerService) return;
    if (!form.service_name.trim()) { setFormError("Nama layanan wajib diisi"); return; }
    if (!form.group_name.trim()) { setFormError("Nama grup wajib diisi"); return; }
    setFormSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/admin/services/${drawerService.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_name: form.service_name.trim(),
          group_name: form.group_name.trim(),
          category: form.category || null,
          buy_price: Number(form.buy_price) || 0,
          sell_price: Number(form.sell_price) || 0,
          time_info: form.time_info,
          info: form.info,
          is_active: form.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Gagal menyimpan"); return; }
      setServices(prev => prev.map(s => s.id === drawerService.id ? {
        ...s,
        service_name: form.service_name.trim(),
        group_name: form.group_name.trim(),
        category: form.category || null,
        buy_price: Number(form.buy_price) || 0,
        sell_price: Number(form.sell_price) || 0,
        time_info: form.time_info,
        info: form.info,
        is_active: form.is_active ? 1 : 0,
      } : s));
      setSyncResult(`✓ Layanan "${form.service_name}" berhasil diperbarui`);
      closeDrawer();
    } catch {
      setFormError("Gagal terhubung ke server");
    } finally {
      setFormSaving(false);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {syncResult && (
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm ${
            syncResult.startsWith("✓")
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400"
          }`}
        >
          <span>{syncResult}</span>
          <button onClick={() => setSyncResult(null)} className="p-1 hover:opacity-70">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari layanan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
            />
          </div>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="text-sm bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          >
            <option value="ALL">Semua Grup</option>
            {groups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openAddDrawer}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-purple hover:bg-brand-purple/90 rounded-lg transition-opacity"
          >
            <Plus size={15} />
            Tambah Layanan
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white gradient-brand rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <CloudDownload size={15} />
            )}
            {syncing ? "Menyinkronkan..." : "Sync Layanan"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
        <span>Total: <strong className="text-foreground">{totalServices}</strong> layanan</span>
        <span>Aktif: <strong className="text-emerald-600 dark:text-emerald-400">{activeCount}</strong></span>
        <span>Nonaktif: <strong className="text-red-500">{inactiveCount}</strong></span>
        {lastSyncedInfo && (
          <span className="ml-auto text-xs">
            <RefreshCw size={12} className="inline mr-1" />
            Terakhir sync: {lastSyncedInfo}
          </span>
        )}
        {syncing && (
          <span className="ml-auto text-xs text-brand-primary">
            <Loader2 size={12} className="inline mr-1 animate-spin" />
            Sedang menyinkronkan...
          </span>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-brand-purple/10 border border-brand-purple/30 rounded-xl animate-fade-in">
          <span className="text-sm font-semibold text-brand-purple">
            {selectedIds.size} layanan dipilih
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => batchSetActive(true)}
              disabled={batchLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50"
            >
              {batchLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <ToggleRight size={13} />
              )}
              Aktifkan Semua
            </button>
            <button
              onClick={() => batchSetActive(false)}
              disabled={batchLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
            >
              {batchLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <ToggleLeft size={13} />
              )}
              Nonaktifkan Semua
            </button>
            <button
              onClick={() => setConfirmDelete({ type: "batch" })}
              disabled={batchLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} />
              Hapus
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <X size={13} />
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">Daftar layanan</caption>
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 w-10">
                  <button
                    onClick={toggleSelectAll}
                    disabled={loading || services.length === 0}
                    className="flex items-center justify-center text-muted-foreground hover:text-brand-primary transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-1 rounded"
                    title={allSelected ? "Batal pilih semua" : "Pilih semua"}
                  >
                    {allSelected ? (
                      <CheckSquare size={16} className="text-brand-primary" />
                    ) : someSelected ? (
                      <Minus size={16} className="text-brand-primary" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Layanan</th>
                <th className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Grup</th>
                <th className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Kategori</th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Harga Beli</th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Harga Jual</th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Margin</th>
                <th className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Status</th>
                <th className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3 w-16">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Memuat layanan...</p>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <CloudDownload size={32} className="mx-auto text-muted-foreground mb-3 opacity-40" />
                    <p className="text-sm text-muted-foreground mb-1">Belum ada layanan di database</p>
                    <p className="text-xs text-muted-foreground">Klik &quot;Sync Layanan&quot; untuk mengimpor layanan dari API seller</p>
                  </td>
                </tr>
              ) : (
                services.map((service) => {
                  const margin = service.sell_price - service.buy_price;
                  const marginPercent = service.buy_price > 0 ? ((margin / service.buy_price) * 100).toFixed(0) : "0";
                  const isEditing = editingId === service.id;
                  const isSelected = selectedIds.has(service.id);

                  return (
                    <tr
                      key={service.id}
                      className={`border-b border-border last:border-b-0 transition-colors ${
                        isSelected
                          ? "bg-brand-purple/5 hover:bg-brand-purple/8"
                          : !service.is_active
                          ? "opacity-50 hover:bg-muted/20"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => toggleSelectOne(service.id)}
                          className="flex items-center justify-center text-muted-foreground hover:text-brand-primary transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-1 rounded"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-brand-primary" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-sm font-medium text-foreground">{service.service_name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{service.service_id}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          {service.group_name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <select
                          value={service.category ?? ""}
                          onChange={async (e) => {
                            const newCat = e.target.value || null;
                            try {
                              setSavingId(service.id);
                              const res = await fetch(`/api/admin/services/${service.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ category: newCat }),
                              });
                              if (res.ok) {
                                setServices(prev => prev.map(s => s.id === service.id ? { ...s, category: newCat } : s));
                              }
                            } catch { } finally {
                              setSavingId(null);
                            }
                          }}
                          className="text-[11px] font-medium bg-transparent border border-border rounded-md px-1.5 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                        >
                          <option value="">—</option>
                          {CATEGORY_OPTIONS.filter(o => o.value !== null).map(o => (
                            <option key={o.value} value={o.value!}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm text-muted-foreground">{formatRupiah(service.buy_price)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <input
                              type="number"
                              value={editSellPrice}
                              onChange={(e) => setEditSellPrice(e.target.value)}
                              className="w-28 px-2 py-1 text-sm text-right bg-background border border-brand-primary rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveSellPrice(service);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                            />
                            <button
                              onClick={() => saveSellPrice(service)}
                              disabled={savingId === service.id}
                              className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                            >
                              {savingId === service.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(service.id);
                              setEditSellPrice(String(service.sell_price));
                            }}
                            className="text-sm font-medium text-foreground hover:text-brand-primary transition-colors cursor-pointer"
                            title="Klik untuk edit harga jual"
                          >
                            {service.sell_price > 0 ? formatRupiah(service.sell_price) : (
                              <span className="text-amber-500 text-xs">Belum diset</span>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {service.sell_price > 0 ? (
                          <span className={`text-sm font-medium ${margin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                            {margin >= 0 ? "+" : ""}{formatRupiah(margin)} ({marginPercent}%)
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => toggleActive(service)}
                          disabled={savingId === service.id}
                          className="inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 group focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-1 rounded"
                          title={service.is_active ? "Klik untuk nonaktifkan" : "Klik untuk aktifkan"}
                          role="switch"
                          aria-checked={!!service.is_active}
                          aria-label="Toggle status aktif"
                        >
                          {savingId === service.id ? (
                            <Loader2 size={14} className="animate-spin text-muted-foreground" />
                          ) : service.is_active ? (
                            <ToggleRight size={18} className="text-emerald-500 group-hover:text-emerald-600 transition-colors" />
                          ) : (
                            <ToggleLeft size={18} className="text-red-400 group-hover:text-red-500 transition-colors" />
                          )}
                          <span className={`text-[11px] font-semibold ${service.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {service.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditDrawer(service)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-brand-primary transition-colors"
                            title="Edit Layanan"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ type: "single", service })}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                            title="Hapus Layanan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Tampilkan</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="bg-card border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>per halaman</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} className="text-muted-foreground" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  if (p === 1 || p === totalPages) return true;
                  if (Math.abs(p - currentPage) <= 1) return true;
                  return false;
                })
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "..." ? (
                    <span key={`dots-${idx}`} className="px-1 text-muted-foreground text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === p
                          ? "gradient-brand text-white"
                          : "border border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            </div>
          )}

          <span className="text-xs text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </span>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete?.type === "single" ? deleteService(confirmDelete.service) : batchDeleteServices()}
        deleting={deleting}
        message={
          confirmDelete?.type === "single" ? (
            <>Layanan <span className="font-semibold text-foreground">&quot;{confirmDelete.service.service_name}&quot;</span> akan dihapus permanen dan tidak dapat dikembalikan.</>
          ) : (
            <><span className="font-semibold text-foreground">{selectedIds.size} layanan</span> yang dipilih akan dihapus permanen dan tidak dapat dikembalikan.</>
          )
        }
      />

      <ServiceFormDrawer
        isOpen={!!drawerMode}
        onClose={closeDrawer}
        mode={drawerMode ?? "add"}
        form={form}
        setField={setField}
        onSubmit={drawerMode === "add" ? createService : updateService}
        saving={formSaving}
        formError={formError}
        groups={groups}
        groupInputMode={groupInputMode}
        setGroupInputMode={setGroupInputMode}
        categoryOptions={CATEGORY_OPTIONS}
        drawerServiceId={drawerService?.service_id}
      />
    </div>
  );
}
