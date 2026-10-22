"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function AdminSearch({
  placeholder = "Search…",
  param = "q",
}: {
  placeholder?: string;
  param?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get(param) ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) next.set(param, trimmed);
    else next.delete(param);
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="admin-field max-w-sm"
      />
      <button type="submit" disabled={pending} className="admin-btn-primary px-4">
        {pending ? "…" : "Search"}
      </button>
    </form>
  );
}
