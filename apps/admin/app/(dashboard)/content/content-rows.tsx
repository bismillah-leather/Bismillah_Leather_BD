"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ToggleButton } from "@/components/toggle-button";

export function PageRow({
  id,
  title,
  meta,
  body,
  isPublished,
}: {
  id: string;
  title: string;
  meta: string;
  body: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nextTitle, setNextTitle] = useState(title);
  const [nextBody, setNextBody] = useState(body);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/admin/api/content/pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle, body: nextBody }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete page “${title}”?`)) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/admin/api/content/pages/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not delete.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="grid gap-3 px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleButton
            endpoint={`/admin/api/content/pages/${id}`}
            flagKey="isPublished"
            active={isPublished}
            activeLabel="Published"
            inactiveLabel="Draft"
          />
          <button type="button" onClick={() => setOpen((v) => !v)} className="admin-btn-ghost h-9 px-3 text-[11px]">
            {open ? "Close" : "Edit"}
          </button>
          <button type="button" disabled={pending} onClick={() => void remove()} className="admin-btn-danger h-9 px-3 text-[11px]">
            Delete
          </button>
        </div>
      </div>
      {open ? (
        <form onSubmit={save} className="grid gap-3 border-t border-border pt-3">
          <input value={nextTitle} onChange={(e) => setNextTitle(e.target.value)} className="admin-field h-9" required />
          <textarea value={nextBody} onChange={(e) => setNextBody(e.target.value)} rows={4} className="admin-field h-auto min-h-24 py-2" />
          <button type="submit" disabled={pending} className="admin-btn-primary h-9 w-fit px-3 text-[11px]">
            {pending ? "Saving…" : "Save edit"}
          </button>
        </form>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </li>
  );
}

export function SectionRow({
  id,
  title,
  meta,
  isActive,
}: {
  id: string;
  title: string;
  meta: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nextTitle, setNextTitle] = useState(title);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/admin/api/content/sections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete section “${title}”?`)) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/admin/api/content/sections/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not delete.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="grid gap-3 px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleButton
            endpoint={`/admin/api/content/sections/${id}`}
            flagKey="isActive"
            active={isActive}
            activeLabel="On"
            inactiveLabel="Off"
          />
          <button type="button" onClick={() => setOpen((v) => !v)} className="admin-btn-ghost h-9 px-3 text-[11px]">
            {open ? "Close" : "Edit"}
          </button>
          <button type="button" disabled={pending} onClick={() => void remove()} className="admin-btn-danger h-9 px-3 text-[11px]">
            Delete
          </button>
        </div>
      </div>
      {open ? (
        <form onSubmit={save} className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <input value={nextTitle} onChange={(e) => setNextTitle(e.target.value)} className="admin-field h-9 max-w-sm" required />
          <button type="submit" disabled={pending} className="admin-btn-primary h-9 px-3 text-[11px]">
            {pending ? "Saving…" : "Save edit"}
          </button>
        </form>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </li>
  );
}

export function SectionCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [key, setKey] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/admin/api/content/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, key: key || title }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not add.");
        return;
      }
      setTitle("");
      setKey("");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="admin-panel mt-3 grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="grid gap-1 text-xs text-muted-foreground">
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="admin-field h-9" required />
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Key
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="new-arrivals" className="admin-field h-9" />
      </label>
      <button type="submit" disabled={pending} className="admin-btn-primary h-9 px-3 text-[11px]">
        {pending ? "Adding…" : "Add"}
      </button>
      {error ? <p className="text-xs text-destructive sm:col-span-3">{error}</p> : null}
    </form>
  );
}
