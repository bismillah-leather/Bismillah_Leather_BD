"use client";

import { useLayoutEffect, useRef } from "react";
import QRCode from "qrcode";

export function CourierQr({ value, size = 108 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const node = canvasRef.current;
    if (!node || !value) return;
    void QRCode.toCanvas(node, value, {
      width: size,
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#111111", light: "#ffffff" },
    });
  }, [size, value]);

  if (!value) return null;
  return <canvas ref={canvasRef} width={size} height={size} className="bg-white" />;
}
