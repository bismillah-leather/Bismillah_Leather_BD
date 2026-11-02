"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/admin/api/auth/logout", { method: "POST" });
      router.replace("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
    >
      {pending ? "…" : "Sign out"}
    </button>
  );
}
