"use client";

import { Package, RefreshCcw, ShieldCheck, Truck } from "lucide-react";

const ICONS = [Truck, Package, RefreshCcw, ShieldCheck] as const;

const FALLBACK = [
  { title: "COD or EPS", text: "Pay on delivery or pay now" },
  { title: "Dhaka ৳80", text: "Outside Dhaka ৳130" },
  { title: "Easy returns", text: "Call us if something is wrong" },
  { title: "Secure checkout", text: "We confirm before dispatch" },
];

export function TrustStrip({ items }: { items?: { title: string; text: string }[] }) {
  const rows = (items && items.length > 0 ? items : FALLBACK).slice(0, 4);
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {rows.map((item, index) => {
        const Icon = ICONS[index] ?? ShieldCheck;
        const title = item.title;
        const text = item.text;
        return (
        <li
          key={`${title}-${index}`}
          className="border border-border bg-white px-4 py-4 transition duration-300 hover:-translate-y-0.5 hover:border-foreground sm:px-5 sm:py-5"
        >
          <div className="flex size-9 items-center justify-center border border-border bg-secondary sm:size-10">
            <Icon className="size-4 sm:size-[18px]" strokeWidth={1.6} aria-hidden="true" />
          </div>
          <p className="font-display mt-3 text-base tracking-tight sm:text-lg">{title}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">{text}</p>
        </li>
        );
      })}
    </ul>
  );
}
