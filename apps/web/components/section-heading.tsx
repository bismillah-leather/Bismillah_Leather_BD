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
    <div className="mb-5 flex items-end justify-between gap-3 sm:mb-6 sm:gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[10px] tracking-[0.28em] text-muted-foreground uppercase sm:text-[11px]">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={`font-display ${eyebrow ? "mt-1.5" : ""} text-xl tracking-tight sm:text-2xl md:text-3xl`}
        >
          {title}
        </h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CenteredRuleHeading({
  children,
  size = "sm",
}: {
  children: ReactNode;
  size?: "sm" | "lg";
}) {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <span className="h-px flex-1 bg-border" />
      <h2
        className={
          size === "lg"
            ? "font-display text-center text-sm tracking-[0.18em] text-foreground uppercase sm:text-base md:text-lg"
            : "text-center text-[10px] tracking-[0.28em] text-muted-foreground uppercase sm:text-[11px]"
        }
      >
        {children}
      </h2>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
