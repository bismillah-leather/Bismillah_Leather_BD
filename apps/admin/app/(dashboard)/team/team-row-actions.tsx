"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Role = "owner" | "manager" | "staff" | "support";

export function TeamRowActions({
  userId,
  userName,
  role,
  isActive,
  isLocked,
  viewerRole,
}: {
  userId: string;
  userName: string;
  role: Role;
  isActive: boolean;
  isLocked: boolean;
  viewerRole: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [ok, setOk] = useState<string | null>(null);

  const canManage =
    (viewerRole === "owner" || viewerRole === "manager") && role !== "owner";
  const canEditRole = viewerRole === "owner" && role !== "owner";
  const canTouch =
    canManage && !(viewerRole === "manager" && role === "manager");

  if (!canTouch) {
    return <p className="text-xs text-muted-foreground">—</p>;
  }

  async function patch(body: Record<string, unknown>) {
    setError(null);
    setOk(null);
    const res = await fetch(`/admin/api/team/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Update failed");
    startTransition(() => router.refresh());
  }

  async function onToggleActive() {
    try {
      await patch({ isActive: !isActive });
      setOk(isActive ? "Deactivated." : "Activated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function onUnlock() {
    try {
      await patch({ unlock: true });
      setOk("Unlocked.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function onRoleChange(next: string) {
    try {
      await patch({ role: next });
      setOk(`Role → ${next}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function onResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    try {
      const res = await fetch(`/admin/api/team/${userId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Reset failed");
        return;
      }
      setOk(`Password reset for ${userName}.`);
      setNewPassword("");
      setResetOpen(false);
      startTransition(() => router.refresh());
    } catch {
      setError("Network error");
    }
  }

  return (
    <div className="grid gap-2 justify-items-end">
      <div className="flex flex-wrap justify-end gap-1.5">
        {canEditRole ? (
          <select
            disabled={pending}
            value={role}
            onChange={(e) => void onRoleChange(e.target.value)}
            className="admin-field h-9 w-auto min-w-[7.5rem] text-xs"
          >
            <option value="manager">manager</option>
            <option value="staff">staff</option>
            <option value="support">support</option>
          </select>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => void onToggleActive()}
          className={`h-9 border px-3 text-xs tracking-wide uppercase transition ${
            isActive
              ? "border-border text-muted-foreground hover:text-foreground"
              : "border-primary/40 bg-primary/15 text-primary"
          }`}
        >
          {isActive ? "Deactivate" : "Activate"}
        </button>
        {isLocked ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => void onUnlock()}
            className="h-9 border border-primary/40 px-3 text-xs tracking-wide text-primary uppercase"
          >
            Unlock
          </button>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => setResetOpen((v) => !v)}
          className="h-9 border border-border px-3 text-xs tracking-wide text-muted-foreground uppercase hover:text-foreground"
        >
          {resetOpen ? "Cancel" : "Reset pw"}
        </button>
      </div>

      {resetOpen ? (
        <form onSubmit={onResetPassword} className="flex flex-wrap items-center gap-2">
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (8+)"
            className="admin-field h-9 w-44 text-xs"
          />
          <button type="submit" disabled={pending} className="admin-btn-primary h-9 px-3 text-xs">
            Set
          </button>
        </form>
      ) : null}

      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
      {ok ? <p className="text-[11px] text-muted-foreground">{ok}</p> : null}
    </div>
  );
}
