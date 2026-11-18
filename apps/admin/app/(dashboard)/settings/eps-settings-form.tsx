"use client";

import { useState } from "react";

export function EpsSettingsForm({
  initial,
}: {
  initial: {
    enabled: boolean;
    mode: "sandbox" | "live";
    username: string;
    merchantId: string;
    storeId: string;
    hasPassword: boolean;
    hasHashKey: boolean;
    ready: boolean;
  };
}) {
  const [enabled, setEnabled] = useState(initial.enabled ?? true);
  const [mode, setMode] = useState<"sandbox" | "live">(initial.mode);
  const [username, setUsername] = useState(initial.username);
  const [password, setPassword] = useState("");
  const [hashKey, setHashKey] = useState("");
  const [merchantId, setMerchantId] = useState(initial.merchantId);
  const [storeId, setStoreId] = useState(initial.storeId);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/admin/api/payments/eps", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          mode,
          username,
          merchantId,
          storeId,
          ...(password.trim() ? { password: password.trim() } : {}),
          ...(hashKey.trim() ? { hashKey: hashKey.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; ready?: boolean };
      if (!res.ok) {
        setError(data.error ?? "Could not save EPS.");
        return;
      }
      setPassword("");
      setHashKey("");
      setMsg(
        data.ready
          ? "EPS is live on checkout. Customers can pay now or choose COD."
          : "Saved. Fill username, password, hash key, merchant id, and store id, then enable.",
      );
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="admin-panel mt-8 grid max-w-xl gap-5 p-6">
      <div>
        <p className="text-[11px] tracking-[0.2em] text-primary uppercase">Online pay</p>
        <h2 className="font-display mt-1 text-2xl tracking-tight">EPS payment</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste username, password, hash key, merchant id, and store id from your EPS pack. Keep this
          enabled. Leave password / hash blank only after they are already saved.
        </p>
        <p className={`mt-2 text-sm ${initial.ready ? "text-emerald-700" : "text-amber-800"}`}>
          {initial.ready
            ? "EPS is active on checkout. Customers can pay now or choose cash on delivery."
            : "EPS is not active yet — checkout Pay now stays off until all five keys are saved."}
        </p>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="size-4 accent-primary"
        />
        Enable Pay with EPS on the store
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Mode</span>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "sandbox" | "live")}
          className="admin-field"
        >
          <option value="live">Live</option>
          <option value="sandbox">Sandbox</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Username</span>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className="admin-field" />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="admin-field"
          placeholder={initial.hasPassword ? "Saved — type to replace" : "EPS password"}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Hash key</span>
        <input
          type="password"
          value={hashKey}
          onChange={(e) => setHashKey(e.target.value)}
          className="admin-field"
          placeholder={initial.hasHashKey ? "Saved — type to replace" : "HMAC hash key"}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Merchant ID</span>
        <input value={merchantId} onChange={(e) => setMerchantId(e.target.value)} className="admin-field" />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Store ID</span>
        <input value={storeId} onChange={(e) => setStoreId(e.target.value)} className="admin-field" />
      </label>
      <p className="text-xs text-muted-foreground">
        Register this site domain in the EPS merchant portal, and set IPN to{" "}
        <code className="text-[11px]">/pay/eps/ipn</code>.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="admin-btn-primary">
          {pending ? "Saving…" : "Save EPS"}
        </button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      </div>
    </form>
  );
}
