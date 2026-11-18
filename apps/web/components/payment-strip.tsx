"use client";

import { useEffect, useState } from "react";

const methods = [
  { label: "COD", hint: "Cash on delivery" },
  { label: "EPS", hint: "Pay with EPS" },
  { label: "bKash", hint: "Mobile wallet" },
  { label: "Nagad", hint: "Mobile wallet" },
  { label: "Card", hint: "Visa / Mastercard" },
  { label: "Pathao", hint: "Courier" },
  { label: "Steadfast", hint: "Courier" },
] as const;

export function PaymentStrip() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="pay-ship-strip">
      <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Pay & ship</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {methods.map((method, index) => (
          <li
            key={method.label}
            title={method.hint}
            className={`pay-ship-chip group relative inline-flex h-9 items-center overflow-hidden border border-border bg-white px-3 text-xs tracking-wide transition duration-300 hover:-translate-y-0.5 hover:border-black hover:bg-black hover:text-white hover:shadow-[0_8px_18px_rgba(0,0,0,0.12)] ${
              ready ? "pay-ship-chip-in" : "translate-y-1 opacity-0"
            }`}
            style={{ transitionDelay: ready ? `${index * 70}ms` : "0ms" }}
          >
            <span className="relative z-10">{method.label}</span>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 transition duration-700 group-hover:translate-x-full group-hover:opacity-100"
            />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Delivery and courier booking confirm after we call you.
      </p>

      <style>{`
        .pay-ship-chip-in {
          opacity: 1;
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .pay-ship-chip {
            transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease !important;
            transition-delay: 0ms !important;
            transform: none !important;
            opacity: 1 !important;
          }
          .pay-ship-chip span[aria-hidden] {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
