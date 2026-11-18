"use client";

export function LabelPrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="admin-btn-primary">
      Print barcodes
    </button>
  );
}
