import { NewBadge } from "./new-badge";

export function ProductShotBadges({
  isNew = false,
  className = "",
}: {
  slug?: string;
  isNew?: boolean;
  className?: string;
}) {
  if (!isNew) return null;
  return (
    <div className={`pointer-events-none absolute top-2.5 right-2.5 z-10 flex items-start ${className}`}>
      <NewBadge />
    </div>
  );
}
