import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { formatDate } from "@/lib/utils";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  X,
  Shield,
  ShieldCheck,
  User,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type UserRole = "superadmin" | "admin" | "reseller" | "user";

type AppUser = {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

const roleBadgeConfig: Record<UserRole, { label: string; color: string; icon: typeof Shield }> = {
  superadmin: { label: "Superadmin", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: ShieldCheck },
  admin: { label: "Admin", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: Shield },
  reseller: { label: "Reseller", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: Shield },
  user: { label: "User", color: "bg-slate-500/10 text-slate-600 dark:text-slate-400", icon: User },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [callerRole, setCallerRole] = useState<UserRole>("admin");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    if (!actionMenuId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-action-menu]")) {
        setActionMenuId(null);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [actionMenuId]);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user?.role) setCallerRole(d.user.role as UserRole);
    }).catch(() => {});
  }, []);

  const isSuperadmin = callerRole === "superadmin";

  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("user");
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterRole !== "ALL") params.set("role", filterRole);
      if (searchQuery) params.set("search", searchQuery);
      params.set("page", String(currentPage));
      params.set("limit", String(perPage));

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setUsers(data.users);
        setTotalUsers(data.total ?? data.users.length);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
        }
      } else {
        setError(data.error || "Gagal memuat data pengguna");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, [filterRole, searchQuery, currentPage, perPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterRole, searchQuery, perPage]);

  function openAdd() {
    setEditingUser(null);
    setFormUsername("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("user");
    setFormStatus("active");
    setError(null);
    setShowModal(true);
  }

  function openEdit(user: AppUser) {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(user.role);
    setFormStatus(user.status);
    setError(null);
    setShowModal(true);
    setActionMenuId(null);
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    try {
      if (editingUser) {
        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formUsername,
            email: formEmail,
            role: formRole,
            status: formStatus,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Gagal mengupdate pengguna");
          return;
        }
      } else {
        if (!formPassword) {
          setError("Password wajib diisi untuk pengguna baru");
          return;
        }

        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formUsername,
            email: formEmail,
            password: formPassword,
            role: formRole,
            status: formStatus,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Gagal menambahkan pengguna");
          return;
        }
      }

      setShowModal(false);
      fetchUsers();
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(userId: number) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch {
      console.error("Gagal menghapus pengguna");
    } finally {
      setDeleteConfirm(null);
      setActionMenuId(null);
    }
  }

  async function toggleStatus(user: AppUser) {
    const newStatus = user.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, status: newStatus } : u
          )
        );
      }
    } catch {
      console.error("Gagal mengubah status");
    } finally {
      setActionMenuId(null);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <ShieldCheck size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Halaman Superadmin</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hanya superadmin yang dapat mengakses halaman ini. Kelola pengguna, ubah role, dan atur status akun.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari username atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="text-sm bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          >
            <option value="ALL">Semua Role</option>
            <option value="superadmin">Superadmin</option>
            <option value="admin">Admin</option>
            <option value="reseller">Reseller</option>
            <option value="user">User</option>
          </select>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white gradient-brand rounded-lg hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus size={15} />
          Tambah Pengguna
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
        <span>Total: <strong className="text-foreground">{totalUsers}</strong> pengguna</span>
        <span>Aktif: <strong className="text-emerald-600 dark:text-emerald-400">{users.filter(u => u.status === "active").length}</strong></span>
        <span>Nonaktif: <strong className="text-red-500">{users.filter(u => u.status === "inactive").length}</strong></span>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Pengguna</th>
                <th className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Role</th>
                <th className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Status</th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Terdaftar</th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">Login Terakhir</th>
                <th className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3 w-16">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Memuat pengguna...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <User size={32} className="mx-auto text-muted-foreground mb-3 opacity-40" />
                    <p className="text-sm text-muted-foreground">Tidak ada pengguna ditemukan</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const role = roleBadgeConfig[user.role] ?? roleBadgeConfig.user;
                  const RoleIcon = role.icon;

                  return (
                    <tr key={user.id} className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-muted-foreground">
                              {user.username.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{user.username}</p>
                            <p className="text-[11px] text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${role.color}`}>
                          <RoleIcon size={12} />
                          {role.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          user.status === "active"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-slate-500/10 text-slate-500"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {user.status === "active" ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(user.created_at)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-xs text-muted-foreground">
                          {user.last_login_at ? formatDate(user.last_login_at) : "Belum pernah"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="relative inline-block" data-action-menu>
                          <button
                            onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                          >
                            <MoreVertical size={15} className="text-muted-foreground" />
                          </button>
                          {actionMenuId === user.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-lg shadow-lg py-1 z-10 animate-fade-in">
                          {(isSuperadmin || user.role !== "superadmin") && (
                            <button
                              onClick={() => openEdit(user)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                            >
                              <Pencil size={14} /> Edit
                            </button>
                          )}
                          {(isSuperadmin || user.role !== "superadmin") && (
                            <button
                              onClick={() => toggleStatus(user)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                            >
                              {user.status === "active" ? (
                                <><AlertTriangle size={14} className="text-amber-500" /> Nonaktifkan</>
                              ) : (
                                <><ShieldCheck size={14} className="text-emerald-500" /> Aktifkan</>
                              )}
                            </button>
                          )}
                          {isSuperadmin && user.role !== "superadmin" && (
                            deleteConfirm === user.id ? (
                              <div className="px-3 py-2 space-y-1.5">
                                <p className="text-[11px] text-red-500 font-medium">Yakin hapus?</p>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => handleDelete(user.id)}
                                    className="flex-1 text-[11px] px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                  >
                                    Ya
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 text-[11px] px-2 py-1 bg-muted text-foreground rounded hover:bg-muted/80 transition-colors"
                                  >
                                    Batal
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-muted transition-colors"
                                onClick={() => setDeleteConfirm(user.id)}
                              >
                                <Trash2 size={14} /> Hapus
                              </button>
                            )
                          )}
                            </div>
                          )}
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

          <span className="text-xs text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </span>
        </div>
      )}

      {showModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">
                {editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Username</label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                  placeholder="email@example.com"
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    disabled={!isSuperadmin}
                  >
                    {isSuperadmin && <option value="admin">Admin</option>}
                    {isSuperadmin && <option value="reseller">Reseller</option>}
                    <option value="user">User</option>
                  </select>
                  {!isSuperadmin && (
                    <p className="text-[10px] text-muted-foreground mt-1">Hanya superadmin yang dapat mengubah role</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as "active" | "inactive")}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !formUsername || !formEmail}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white gradient-brand rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editingUser ? "Simpan Perubahan" : "Tambah Pengguna"}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
