"use client";

import { Package, RefreshCcw, ShieldCheck, Truck } from "lucide-react";

const items = [
  { icon: Truck, title: "Cash on delivery", text: "Pay when the parcel arrives" },
  { icon: Package, title: "Dhaka ৳80", text: "Outside Dhaka ৳130" },
  { icon: RefreshCcw, title: "Easy returns", text: "Call us if something is wrong" },
  { icon: ShieldCheck, title: "Secure checkout", text: "We confirm before dispatch" },
] as const;

export function TrustStrip() {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {items.map(({ icon: Icon, title, text }) => (
        <li
          key={title}
          className="border border-border bg-white px-4 py-4 transition duration-300 hover:-translate-y-0.5 hover:border-foreground sm:px-5 sm:py-5"
        >
          <div className="flex size-9 items-center justify-center border border-border bg-secondary sm:size-10">
            <Icon className="size-4 sm:size-[18px]" strokeWidth={1.6} aria-hidden="true" />
          </div>
          <p className="font-display mt-3 text-base tracking-tight sm:text-lg">{title}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">{text}</p>
        </li>
      ))}
    </ul>
  );
}
