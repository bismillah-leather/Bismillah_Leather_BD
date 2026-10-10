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
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">{eyebrow}</p>
        ) : null}
        <h2 className={`font-display ${eyebrow ? "mt-2" : ""} text-3xl sm:text-5xl`}>{title}</h2>
      </div>
      {action}
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
