"use client";

import { Button, Input } from "@bismillah/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/admin/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Sign in failed.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <label className="grid gap-2 text-sm">
        <span className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Email</span>
        <Input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="owner@bismillah.local"
          className="h-12"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
          Password
        </span>
        <Input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12"
        />
      </label>
      {error ? (
        <p
          className="border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="mt-1 h-12 tracking-[0.06em] uppercase">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
