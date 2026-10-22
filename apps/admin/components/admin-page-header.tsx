import type { ReactNode } from "react";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? (
          <p className="text-[11px] tracking-[0.22em] text-primary uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="font-display mt-1.5 text-3xl tracking-tight sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
