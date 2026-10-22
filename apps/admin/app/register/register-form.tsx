"use client";

import { Button, Input } from "@bismillah/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLES = [
  { value: "staff", label: "Staff" },
  { value: "manager", label: "Manager" },
  { value: "support", label: "Support" },
] as const;

const fieldClass =
  "h-12 border-white/18 bg-card/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-visible:border-primary";

const selectClass =
  "flex h-12 w-full rounded-md border border-white/18 bg-card/80 px-3 text-sm text-foreground outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-visible:border-primary";

export function RegisterForm({
  masterReady,
  requireMasterKey = true,
}: {
  masterReady: boolean;
  /** When false, caller is already an owner/manager (Team page). */
  requireMasterKey?: boolean;
}) {
  const router = useRouter();
  const stayOnPage = !requireMasterKey;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("staff");
  const [masterKey, setMasterKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!masterReady && requireMasterKey) {
      setError("ADMIN_MASTER_KEY is not set on this server.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/admin/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          ...(requireMasterKey ? { masterKey } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; email?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not register.");
        return;
      }
      if (stayOnPage) {
        setOk(`Created ${data.email}.`);
        setName("");
        setEmail("");
        setPassword("");
        setConfirm("");
        setRole("staff");
        router.refresh();
      } else {
        setOk(`Created ${data.email}. Redirecting to sign in…`);
        window.setTimeout(() => {
          router.replace("/");
          router.refresh();
        }, 900);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Full name
        </span>
        <Input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Staff name"
          className={fieldClass}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Email</span>
        <Input
          type="email"
          required
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="staff@bismillah.local"
          className={fieldClass}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Role</span>
        <select value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Password
          </span>
          <Input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Confirm
          </span>
          <Input
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            className={fieldClass}
          />
        </label>
      </div>

      {requireMasterKey ? (
        <label className="grid gap-2 text-sm">
          <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Master key
          </span>
          <Input
            type="password"
            required
            autoComplete="off"
            value={masterKey}
            onChange={(e) => setMasterKey(e.target.value)}
            placeholder="Server master key"
            className={fieldClass}
          />
        </label>
      ) : null}

      {error ? (
        <p
          className="border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="border border-primary/25 bg-primary/10 px-3.5 py-3 text-sm text-foreground" role="status">
          {ok}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending || (!masterReady && requireMasterKey)}
        className="mt-1 h-12 bg-primary text-primary-foreground tracking-[0.12em] uppercase hover:bg-primary/90"
      >
        {pending ? "Creating…" : "Create admin"}
      </Button>
    </form>
  );
}
