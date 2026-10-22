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
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Email
        </span>
        <Input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="owner@bismillah.local"
          className="h-12 border-white/18 bg-card/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-visible:border-primary"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Password
        </span>
        <Input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 border-white/18 bg-card/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-visible:border-primary"
        />
      </label>

      {error ? (
        <p
          className="border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="mt-1 h-12 bg-primary text-primary-foreground tracking-[0.12em] uppercase hover:bg-primary/90"
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
