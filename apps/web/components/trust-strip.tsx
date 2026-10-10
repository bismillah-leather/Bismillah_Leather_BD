import { Package, RefreshCcw, ShieldCheck, Truck } from "lucide-react";

const items = [
  { icon: Truck, title: "Cash on delivery", text: "Pay when the parcel arrives" },
  { icon: Package, title: "Dhaka ৳80", text: "Outside Dhaka ৳130" },
  { icon: RefreshCcw, title: "Easy returns", text: "Call us if something is wrong" },
  { icon: ShieldCheck, title: "Secure checkout", text: "We confirm before dispatch" },
] as const;

export function TrustStrip() {
  return (
    <ul className="grid grid-cols-2 gap-4 border-y border-border bg-white py-6 sm:gap-6 sm:py-8 lg:grid-cols-4">
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex items-start gap-2.5 px-1 sm:justify-center sm:gap-3 sm:px-2">
          <Icon className="mt-0.5 size-4 shrink-0 sm:size-5" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-medium sm:text-sm">{title}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground sm:text-xs">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
