import type { ReactNode } from "react";

const POINTS = [
  "Orders & flash sale controls",
  "Product films linked to SKUs",
  "Security alerts & lockouts",
] as const;

export function AdminAuthShell({
  eyebrow,
  formTitle,
  lead,
  panelTitle,
  panelSubtitle,
  footer,
  children,
  panelNote,
}: {
  eyebrow: string;
  formTitle: string;
  lead: string;
  panelTitle: string;
  panelSubtitle: string;
  footer?: ReactNode;
  children: ReactNode;
  panelNote?: string;
}) {
  return (
    <div className="relative grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden lg:block">
        <div
          className="admin-auth-ken absolute inset-0 scale-105 bg-cover bg-center"
          style={{ backgroundImage: "url(/admin/catalog/hero-leather.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c0a] via-[#0e0c0a]/80 to-[#0e0c0a]/45" />
        <div aria-hidden className="admin-auth-grain absolute inset-0 opacity-[0.22] mix-blend-overlay" />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(198,161,91,0.22),transparent_68%)]"
        />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <div className="admin-auth-rise">
            <p className="font-display text-4xl tracking-tight text-white xl:text-5xl">Bismillah</p>
            <p className="mt-2 text-[11px] tracking-[0.28em] text-white/55 uppercase">
              Leather · Staff console
            </p>
          </div>

          <div className="admin-auth-rise admin-auth-rise-delay max-w-md">
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-white xl:text-5xl">
              {panelTitle}
            </h1>
            <p className="mt-5 text-sm leading-7 text-white/70">{panelSubtitle}</p>
            <ul className="mt-9 grid gap-3.5 border-t border-white/10 pt-7">
              {POINTS.map((point) => (
                <li key={point} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="h-px w-6 shrink-0 bg-white/80" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs tracking-wide text-white/40">
            {panelNote ?? "Protected access · rate-limited sessions"}
          </p>
        </div>
      </aside>

      <section className="relative flex items-center justify-center px-5 py-14 sm:px-10 lg:px-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #000 0.55px, transparent 0.65px), radial-gradient(circle at 80% 70%, #000 0.4px, transparent 0.5px)",
            backgroundSize: "28px 28px, 42px 42px",
          }}
        />

        <div className="admin-auth-rise relative w-full max-w-[24rem]">
          <p className="text-[11px] tracking-[0.26em] text-primary uppercase">{eyebrow}</p>
          <h2 className="font-display mt-4 text-[2.35rem] leading-[1.05] tracking-tight sm:text-4xl">
            {formTitle}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{lead}</p>

          <div className="mt-8">{children}</div>

          {footer ? <div className="mt-8 text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </section>
    </div>
  );
}
