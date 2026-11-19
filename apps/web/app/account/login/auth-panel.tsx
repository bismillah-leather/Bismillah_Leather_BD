"use client";

import { BD_DISTRICTS, BRAND } from "@bismillah/shared";
import { BrandLogo } from "@/components/brand-logo";
import { Button, Input } from "@bismillah/ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Lock, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

type Mode = "signin" | "register";

const PERKS = [
  { icon: ShieldCheck, text: "Order history on this number" },
  { icon: Lock, text: "Secure session · no password needed" },
  { icon: Sparkles, text: "COD + confirmation call before pack" },
] as const;

const selectClass =
  "flex h-12 w-full rounded-md border border-input bg-white px-3 text-sm text-foreground outline-none transition focus-visible:border-foreground";

export function AccountAuthPanel() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const tabsId = useId();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [district, setDistrict] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [whatsappOk, setWhatsappOk] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "signin"
            ? { mode, phone, remember }
            : {
                mode,
                name,
                phone,
                email,
                district,
                addressLine,
                whatsappOk,
                termsAccepted,
                remember,
              },
        ),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not continue.");
        return;
      }
      router.replace("/account");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative grid min-h-[calc(100dvh-var(--site-header-offset,7rem))] lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-neutral-950 text-white lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/catalog/hero-leather.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/35" />
        <div aria-hidden className="auth-grain absolute inset-0 opacity-[0.18] mix-blend-overlay" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <BrandLogo onDark size={52} className="mb-5 h-12 w-12" />
            <p className="text-[11px] tracking-[0.28em] text-white/65 uppercase">
              {BRAND.shortName} account
            </p>
            <h2 className="font-display mt-4 max-w-md text-4xl leading-[1.05] tracking-tight xl:text-5xl">
              Leather that travels with you — tracked from Mirpur-10.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/70">
              Sign in with mobile, or register with delivery details so checkout stays fast.
            </p>
          </motion.div>

          <ul className="grid gap-3">
            {PERKS.map((perk, i) => (
              <motion.li
                key={perk.text}
                initial={reduce ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-3 border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm"
              >
                <perk.icon className="size-4 shrink-0 text-white" strokeWidth={1.75} />
                <span className="text-sm text-white/85">{perk.text}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="relative flex items-start justify-center bg-white px-4 py-10 sm:px-8 lg:items-center lg:px-12 xl:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 22%, #000 0.55px, transparent 0.65px), radial-gradient(circle at 82% 70%, #000 0.45px, transparent 0.55px)",
            backgroundSize: "26px 26px, 38px 38px",
          }}
        />

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[28rem] py-2"
        >
          <Link
            href="/"
            className="text-xs tracking-[0.16em] text-muted-foreground uppercase transition hover:text-foreground"
          >
            ← Back to shop
          </Link>

          <div className="mt-6 flex items-center gap-3 lg:hidden">
            <BrandLogo size={40} className="h-10 w-10" />
            <span className="font-display text-lg tracking-tight">{BRAND.name}</span>
          </div>
          <h1 className="font-display mt-6 text-4xl tracking-tight sm:text-5xl">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {mode === "signin"
              ? "Sign in with your Bangladesh mobile. New here? Switch to Register."
              : "Name, mobile, email, district & address — then agree to continue."}
          </p>

          <div
            role="tablist"
            aria-label="Account access"
            className="relative mt-8 grid grid-cols-2 gap-1 border border-border bg-secondary/60 p-1"
          >
            {(
              [
                { id: "signin" as const, label: "Sign in" },
                { id: "register" as const, label: "Register" },
              ] as const
            ).map((tab) => {
              const selected = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`${tabsId}-${tab.id}`}
                  aria-selected={selected}
                  onClick={() => {
                    setMode(tab.id);
                    setError(null);
                  }}
                  className={`relative z-10 h-11 text-sm font-medium transition ${
                    selected ? "text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {selected ? (
                    <motion.span
                      layoutId="auth-tab-pill"
                      className="pointer-events-none absolute inset-0 bg-foreground"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              role="tabpanel"
              aria-labelledby={`${tabsId}-${mode}`}
              onSubmit={onSubmit}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 grid gap-4"
            >
              {mode === "register" ? (
                <>
                  <label className="grid gap-2 text-sm">
                    <span className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
                      Full name <span className="text-foreground">*</span>
                    </span>
                    <Input
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="h-12"
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
                      Mobile <span className="text-foreground">*</span>
                    </span>
                    <Input
                      required
                      autoComplete="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="h-12"
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
                      Email <span className="font-normal normal-case tracking-normal">(optional)</span>
                    </span>
                    <Input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="h-12"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm">
                      <span className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
                        District
                      </span>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Select district</option>
                        {BD_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm sm:col-span-1">
                      <span className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
                        Area / address
                      </span>
                      <Input
                        autoComplete="street-address"
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        placeholder="Road, house, area"
                        className="h-12"
                      />
                    </label>
                  </div>

                  <label className="flex items-start gap-3 text-sm leading-5 text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={whatsappOk}
                      onChange={(e) => setWhatsappOk(e.target.checked)}
                      className="mt-1 size-4 accent-foreground"
                    />
                    <span>WhatsApp updates on this number (order + delivery).</span>
                  </label>

                  <label className="flex items-start gap-3 text-sm leading-5 text-muted-foreground">
                    <input
                      type="checkbox"
                      required
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 size-4 accent-foreground"
                    />
                    <span>
                      I agree to{" "}
                      <Link href="/policies/privacy" className="underline underline-offset-2">
                        privacy
                      </Link>{" "}
                      &{" "}
                      <Link href="/policies/returns" className="underline underline-offset-2">
                        returns
                      </Link>{" "}
                      notes. <span className="text-foreground">*</span>
                    </span>
                  </label>
                </>
              ) : (
                <>
                  <label className="grid gap-2 text-sm">
                    <span className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
                      Mobile <span className="text-foreground">*</span>
                    </span>
                    <Input
                      required
                      autoComplete="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="h-12"
                    />
                  </label>
                  <p className="border border-border bg-secondary/50 px-3.5 py-3 text-xs leading-5 text-muted-foreground">
                    First time? Open{" "}
                    <button
                      type="button"
                      className="font-medium text-foreground underline underline-offset-2"
                      onClick={() => setMode("register")}
                    >
                      Register
                    </button>{" "}
                    for name, email, district & address.
                  </p>
                </>
              )}

              <label className="flex items-center gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-4 accent-foreground"
                />
                <span>Keep me signed in on this device</span>
              </label>

              <AnimatePresence>
                {error ? (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
                    role="alert"
                  >
                    {error}
                  </motion.p>
                ) : null}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={pending}
                className="group mt-1 h-12 tracking-[0.06em] uppercase"
              >
                {pending ? (
                  mode === "signin" ? "Signing in…" : "Creating…"
                ) : (
                  <span className="inline-flex items-center gap-2">
                    {mode === "signin" ? "Sign in" : "Create account"}
                    <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                  </span>
                )}
              </Button>

              {mode === "signin" ? (
                <p className="text-center text-xs text-muted-foreground">
                  New here?{" "}
                  <button
                    type="button"
                    className="underline underline-offset-2"
                    onClick={() => setMode("register")}
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  Already registered?{" "}
                  <button
                    type="button"
                    className="underline underline-offset-2"
                    onClick={() => setMode("signin")}
                  >
                    Sign in
                  </button>
                </p>
              )}
            </motion.form>
          </AnimatePresence>

          <div className="mt-10 grid gap-2 border-t border-border pt-6 lg:hidden">
            {PERKS.map((perk) => (
              <p key={perk.text} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="size-3.5 text-foreground" strokeWidth={2} />
                {perk.text}
              </p>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
