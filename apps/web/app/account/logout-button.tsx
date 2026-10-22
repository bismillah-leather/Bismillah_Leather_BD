"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AccountLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/account/logout", { method: "POST" });
      router.replace("/account/login");
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
      className="inline-flex h-11 items-center border border-border px-4 text-sm transition hover:border-foreground disabled:opacity-50"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
