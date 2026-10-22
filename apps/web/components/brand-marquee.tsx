const BRANDS = [
  "Louis Vuitton",
  "Gucci",
  "Coach",
  "Fossil",
  "Tommy Hilfiger",
  "Hugo Boss",
  "Armani",
  "Michael Kors",
  "Montblanc",
  "Ralph Lauren",
  "Burberry",
  "Hermès",
  "Prada",
  "Versace",
  "Ted Baker",
] as const;

/** Splayd-style thin black headline ticker — auto-scroll brand names. */
export function BrandMarquee() {
  const loop = [...BRANDS, ...BRANDS];

  return (
    <aside
      aria-label="Featured brands"
      className="overflow-hidden border-y border-black bg-black text-white"
    >
      <div className="marquee-track flex items-center gap-0 py-2 sm:py-2.5">
        {loop.map((name, index) => (
          <span
            key={`${name}-${index}`}
            className="inline-flex shrink-0 items-center gap-3.5 px-3.5 text-[10px] tracking-[0.1em] text-white/95 sm:gap-4 sm:px-4 sm:text-[11px]"
          >
            <span className="size-1 shrink-0 rounded-full bg-white/85" aria-hidden="true" />
            <span className="whitespace-nowrap uppercase">{name}</span>
          </span>
        ))}
      </div>
    </aside>
  );
}
