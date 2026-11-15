"use client";

import { Eye, Users } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { syncProductViewersAction } from "@/app/viewers/actions";

type Registry = {
  add: (slug: string) => void;
  remove: (slug: string) => void;
};

const RegistryContext = createContext<Registry | null>(null);
const CountsContext = createContext<Record<string, number>>({});

function visitorId() {
  const key = "bl-viewer-id";
  const existing = localStorage.getItem(key);
  if (existing && /^[0-9a-f-]{16,80}$/i.test(existing)) return existing;
  const next = crypto.randomUUID();
  localStorage.setItem(key, next);
  return next;
}

export function LiveViewersProvider({ children }: { children: ReactNode }) {
  const members = useRef(new Map<string, number>());
  const hidden = useRef(false);
  const ticket = useRef(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const debounce = useRef<number | null>(null);

  const flush = useCallback(async () => {
    const current = ++ticket.current;
    const slugs = hidden.current ? [] : [...members.current.keys()];
    const next = await syncProductViewersAction({ visitorId: visitorId(), slugs });
    if (current !== ticket.current || !next) return;
    setCounts(next);
  }, []);

  const schedule = useCallback(() => {
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => {
      void flush();
    }, 400);
  }, [flush]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void flush();
    }, 4000);
    const onHide = () => {
      hidden.current = document.visibilityState === "hidden";
      void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onHide);
      if (debounce.current) window.clearTimeout(debounce.current);
    };
  }, [flush]);

  const registry = useMemo<Registry>(
    () => ({
      add(slug) {
        const next = (members.current.get(slug) ?? 0) + 1;
        members.current.set(slug, next);
        if (next === 1) schedule();
      },
      remove(slug) {
        const next = (members.current.get(slug) ?? 1) - 1;
        if (next <= 0) members.current.delete(slug);
        else members.current.set(slug, next);
        schedule();
      },
    }),
    [schedule],
  );

  return (
    <RegistryContext.Provider value={registry}>
      <CountsContext.Provider value={counts}>{children}</CountsContext.Provider>
    </RegistryContext.Provider>
  );
}

export function LiveViewers({
  slug,
  pinned = false,
  tone = "chip",
  className = "",
}: {
  slug: string;
  pinned?: boolean;
  tone?: "chip" | "line";
  className?: string;
}) {
  const registry = useContext(RegistryContext);
  const counts = useContext(CountsContext);
  const ref = useRef<HTMLSpanElement>(null);
  const raw = counts[slug];
  const count = pinned ? Math.max(1, raw ?? 1) : (raw ?? 0);

  useEffect(() => {
    if (!registry) return;
    let on = false;
    const enter = () => {
      if (on) return;
      on = true;
      registry.add(slug);
    };
    const leave = () => {
      if (!on) return;
      on = false;
      registry.remove(slug);
    };
    if (pinned) {
      enter();
      return leave;
    }
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) enter();
        else leave();
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      leave();
    };
  }, [pinned, registry, slug]);

  const label = `${count} ${count === 1 ? "person" : "people"} viewing this right now`;

  if (tone === "line") {
    return (
      <span
        ref={ref}
        role="status"
        aria-label={label}
        className={`flex w-full items-center gap-3 bg-[#2c1614] px-3.5 py-3 ring-1 ring-[#e10600]/40 ${className}`}
      >
        <span className="relative grid size-11 shrink-0 place-items-center bg-[#e10600] text-white">
          <Users className="size-5" strokeWidth={1.75} aria-hidden />
          <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#7dff9a]" />
            <span className="relative m-auto size-2 rounded-full bg-[#7dff9a]" />
          </span>
        </span>
        <span className="min-w-0">
          <span className="flex items-baseline gap-2">
            <span
              key={count}
              className="font-display text-[1.65rem] leading-none tracking-tight text-white tabular-nums"
            >
              {count}
            </span>
            <span className="text-[15px] font-medium leading-none text-[#f6efe4]">
              {count === 1 ? "person viewing now" : "people viewing now"}
            </span>
          </span>
          <span className="mt-1.5 block text-[12px] leading-none text-[#d7b07a]">
            {count === 1 ? "Someone is on this page right now" : "People are on this page right now"}
          </span>
        </span>
      </span>
    );
  }

  return (
    <span
      ref={ref}
      role="status"
      title={label}
      aria-label={label}
      className={`pointer-events-none inline-flex items-center gap-1 border border-black bg-white px-2 py-1 text-[11px] font-medium text-black shadow-sm ${className}`}
    >
      <Eye className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="min-w-[0.6rem] tabular-nums">{count}</span>
    </span>
  );
}
