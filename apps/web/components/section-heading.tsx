import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-3 sm:mb-8 sm:gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">{eyebrow}</p>
        ) : null}
        <h2 className={`font-display ${eyebrow ? "mt-2" : ""} text-2xl sm:text-5xl`}>{title}</h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CenteredRuleHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="h-px flex-1 bg-border" />
      <h2 className="text-center text-xs tracking-[0.28em] text-muted-foreground uppercase">
        {children}
      </h2>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
