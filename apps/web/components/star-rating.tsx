export function StarRating({
  value,
  size = "md",
  className = "",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim = size === "lg" ? 18 : size === "sm" ? 12 : 14;
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = rounded >= i + 1 ? 1 : rounded >= i + 0.5 ? 0.5 : 0;
        return (
          <svg key={i} width={dim} height={dim} viewBox="0 0 20 20" aria-hidden className="shrink-0">
            <path
              d="M10 1.8 12.5 7l5.7.5-4.3 3.7 1.3 5.6L10 14.2 4.8 16.8l1.3-5.6L1.8 7.5 7.5 7 10 1.8Z"
              fill={fill === 1 ? "#b45309" : "none"}
              stroke="#b45309"
              strokeWidth="1.2"
            />
            {fill === 0.5 ? (
              <path d="M10 1.8 12.5 7l5.7.5-4.3 3.7 1.3 5.6L10 14.2V1.8Z" fill="#b45309" />
            ) : null}
          </svg>
        );
      })}
    </span>
  );
}
