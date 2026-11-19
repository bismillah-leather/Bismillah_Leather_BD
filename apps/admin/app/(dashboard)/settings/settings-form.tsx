"use client";

import { useState } from "react";

export function SettingsForm({
  initial,
}: {
  initial: {
    name: string;
    supportPhone: string;
    supportWhatsapp: string;
    email: string;
    facebookUrl: string;
    youtubeUrl: string;
    codNote: string;
    announcement: string;
    shippingNote: string;
    address: string;
    addressShort: string;
  };
}) {
  const [name, setName] = useState(initial.name);
  const [supportPhone, setSupportPhone] = useState(initial.supportPhone);
  const [supportWhatsapp, setSupportWhatsapp] = useState(initial.supportWhatsapp);
  const [email, setEmail] = useState(initial.email);
  const [facebookUrl, setFacebookUrl] = useState(initial.facebookUrl);
  const [youtubeUrl, setYoutubeUrl] = useState(initial.youtubeUrl);
  const [codNote, setCodNote] = useState(initial.codNote);
  const [announcement, setAnnouncement] = useState(initial.announcement);
  const [shippingNote, setShippingNote] = useState(initial.shippingNote);
  const [address, setAddress] = useState(initial.address);
  const [addressShort, setAddressShort] = useState(initial.addressShort);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveOne(key: string, value: string) {
    const res = await fetch("/admin/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "Save failed");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMsg(null);
    try {
      await saveOne("store.name", name.trim());
      await saveOne("store.supportPhone", supportPhone.trim());
      await saveOne("store.supportWhatsapp", supportWhatsapp.trim());
      await saveOne("store.email", email.trim());
      await saveOne("store.facebookUrl", facebookUrl.trim());
      await saveOne("store.youtubeUrl", youtubeUrl.trim());
      await saveOne("store.codNote", codNote.trim());
      await saveOne("store.announcement", announcement.trim());
      await saveOne("store.shippingNote", shippingNote.trim());
      await saveOne("store.address", address.trim());
      await saveOne("store.addressShort", addressShort.trim());
      setMsg("Settings saved — storefront picks these up on next load.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="admin-panel mt-6 grid max-w-xl gap-5 p-6">
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Store name
        </span>
        <input value={name} onChange={(e) => setName(e.target.value)} className="admin-field" />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Support phone (display)
        </span>
        <input
          value={supportPhone}
          onChange={(e) => setSupportPhone(e.target.value)}
          className="admin-field"
          placeholder="01957-876157"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          WhatsApp number
        </span>
        <input
          value={supportWhatsapp}
          onChange={(e) => setSupportWhatsapp(e.target.value)}
          className="admin-field"
          placeholder="8801957876157"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="admin-field"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Facebook URL
        </span>
        <input
          value={facebookUrl}
          onChange={(e) => setFacebookUrl(e.target.value)}
          className="admin-field"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          YouTube channel URL
        </span>
        <input
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          className="admin-field"
          placeholder="https://www.youtube.com/@yourchannel"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Shop address (full)
        </span>
        <input value={address} onChange={(e) => setAddress(e.target.value)} className="admin-field" />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Address short
        </span>
        <input
          value={addressShort}
          onChange={(e) => setAddressShort(e.target.value)}
          className="admin-field"
          placeholder="Mirpur-10 · Shah Ali Plaza"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          COD note
        </span>
        <textarea
          value={codNote}
          onChange={(e) => setCodNote(e.target.value)}
          rows={3}
          className="admin-field h-auto min-h-20 py-2.5"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Shipping note
        </span>
        <textarea
          value={shippingNote}
          onChange={(e) => setShippingNote(e.target.value)}
          rows={3}
          className="admin-field h-auto min-h-20 py-2.5"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Storefront announcement
        </span>
        <textarea
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          rows={3}
          className="admin-field h-auto min-h-20 py-2.5"
          placeholder="Optional banner text"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="admin-btn-primary">
          {pending ? "Saving…" : "Save settings"}
        </button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      </div>
    </form>
  );
}
