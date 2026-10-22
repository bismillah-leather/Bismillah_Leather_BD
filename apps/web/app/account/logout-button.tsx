"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AccountLogoutButton({ tone = "light" }: { tone?: "light" | "dark" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const dark = tone === "dark";

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
      className={`inline-flex h-11 items-center px-4 text-sm transition disabled:opacity-50 ${
        dark
          ? "border border-white/35 text-white hover:bg-white hover:text-black"
          : "border border-border hover:border-foreground"
      }`}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
