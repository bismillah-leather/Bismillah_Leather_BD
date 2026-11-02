"use client";

export function PrintStatementButton() {
  return (
    <button type="button" onClick={() => window.print()} className="admin-btn-ghost h-10 px-4 text-[11px]">
      Print / PDF
    </button>
  );
}
