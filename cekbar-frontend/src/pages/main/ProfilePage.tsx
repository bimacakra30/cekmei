import { useState, useEffect, useCallback } from "react";
import { User, Mail, Phone, Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type ProfileData = {
  id: number;
  nama: string;
  username: string;
  email: string;
  no_hp: string;
  role: string;
  created_at: string;
  last_login_at: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [noHp, setNoHp] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setNama(data.nama);
        setEmail(data.email);
        setNoHp(data.no_hp);
      }
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, email, no_hp: noHp }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, nama: data.nama, email: data.email, no_hp: data.no_hp } : prev);
        setProfileMsg({ type: "success", text: "Profil berhasil diperbarui" });
      } else {
        setProfileMsg({ type: "error", text: data.error || "Gagal menyimpan" });
      }
    } catch {
      setProfileMsg({ type: "error", text: "Terjadi kesalahan jaringan" });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Password baru minimal 6 karakter" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Konfirmasi password tidak cocok" });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ type: "success", text: "Password berhasil diubah" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMsg({ type: "error", text: data.error || "Gagal mengubah password" });
      }
    } catch {
      setPasswordMsg({ type: "error", text: "Terjadi kesalahan jaringan" });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
              style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
            >
              {profile?.nama?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{profile?.nama}</h2>
              <p className="text-xs text-muted-foreground">@{profile?.username} · {profile?.role}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Nama Lengkap</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Username</label>
            <input
              type="text"
              value={profile?.username ?? ""}
              readOnly
              className="w-full px-4 py-2.5 text-sm bg-muted/30 border border-border rounded-xl text-muted-foreground cursor-not-allowed"
            />
            <p className="text-[10px] text-muted-foreground/60 mt-1">Username tidak dapat diubah</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Nomor HP</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
            <span>Terdaftar: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" }) : "—"}</span>
            {profile?.last_login_at && (
              <span>Login terakhir: {new Date(profile.last_login_at).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</span>
            )}
          </div>

          {profileMsg && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm",
              profileMsg.type === "success" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400" : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400"
            )}>
              {profileMsg.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {profileMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {profileSaving && <Loader2 size={15} className="animate-spin" />}
            Simpan Perubahan
          </button>
        </form>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <Lock size={18} className="text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">Ganti Password</h2>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Password Saat Ini</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
                required
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Password Baru</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
                placeholder="Minimal 6 karakter"
                required
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Konfirmasi Password Baru</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
                placeholder="Ketik ulang password baru"
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {passwordMsg && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm",
              passwordMsg.type === "success" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400" : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400"
            )}>
              {passwordMsg.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {passwordMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {passwordSaving && <Loader2 size={15} className="animate-spin" />}
            Ubah Password
          </button>
        </form>
      </div>
    </div>
  );
}
