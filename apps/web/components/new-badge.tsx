export function NewBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none inline-flex h-5 items-center bg-[#e10600] px-1.5 text-[10px] font-semibold tracking-[0.12em] text-white uppercase ${className}`}
    >
      New
    </span>
  );
}
