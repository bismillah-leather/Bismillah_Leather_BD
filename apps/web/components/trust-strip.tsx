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
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
      {items.map(({ icon: Icon, title, text }) => (
        <li
          key={title}
          className="border border-border bg-white px-5 py-6 transition duration-300 hover:-translate-y-1 hover:border-foreground sm:px-6 sm:py-8"
        >
          <div className="flex size-12 items-center justify-center border border-border bg-secondary sm:size-14">
            <Icon className="size-5 sm:size-6" strokeWidth={1.6} aria-hidden="true" />
          </div>
          <p className="font-display mt-5 text-xl tracking-tight sm:text-2xl">{title}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{text}</p>
        </li>
      ))}
    </ul>
  );
}
