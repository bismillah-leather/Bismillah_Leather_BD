"use client";

import JsBarcode from "jsbarcode";
import { useId, useLayoutEffect, useRef } from "react";

export function CourierBarcode({
  value,
  height = 72,
  compact = false,
}: {
  value: string;
  height?: number;
  compact?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const reactId = useId();

  useLayoutEffect(() => {
    const node = svgRef.current;
    if (!node || !value) return;
    try {
      JsBarcode(node, value, {
        format: "CODE128",
        width: compact ? 2 : 2.4,
        height,
        displayValue: false,
        margin: 10,
        marginTop: 4,
        marginBottom: 4,
        background: "#ffffff",
        lineColor: "#111111",
      });
    } catch {
      node.replaceChildren();
    }
  }, [compact, height, value]);

  if (!value) return null;

  return (
    <div className={`grid w-full justify-items-center ${compact ? "gap-1" : "gap-2"}`}>
      <svg
        ref={svgRef}
        role="img"
        aria-label={`Barcode ${value}`}
        data-barcode={reactId}
        className="h-auto w-full bg-white"
      />
      <p
        className={`font-semibold tracking-[0.12em] text-neutral-950 tabular-nums ${
          compact ? "text-sm" : "text-lg"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
