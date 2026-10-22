"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProfileForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/admin/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not update profile.");
        return;
      }
      setMsg("Profile saved.");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="admin-panel grid gap-4 p-5 sm:p-6">
      <div>
        <p className="text-[11px] tracking-[0.2em] text-primary uppercase">Profile</p>
        <h2 className="font-display mt-1 text-2xl tracking-tight">Display name</h2>
      </div>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Name
        </span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="admin-field"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="admin-btn-primary">
          {pending ? "Saving…" : "Save name"}
        </button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/admin/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not change password.");
        return;
      }
      setMsg("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="admin-panel grid gap-4 p-5 sm:p-6">
      <div>
        <p className="text-[11px] tracking-[0.2em] text-primary uppercase">Security</p>
        <h2 className="font-display mt-1 text-2xl tracking-tight">Change password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use a strong password (8+ characters). You stay signed in after changing it.
        </p>
      </div>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Current password
        </span>
        <input
          required
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="admin-field"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          New password
        </span>
        <input
          required
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="admin-field"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Confirm new password
        </span>
        <input
          required
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="admin-field"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="admin-btn-primary">
          {pending ? "Updating…" : "Update password"}
        </button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      </div>
    </form>
  );
}
