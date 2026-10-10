import { Package, RefreshCcw, ShieldCheck, Truck } from "lucide-react";

const items = [
  { icon: Truck, title: "Cash on delivery", text: "Pay when the parcel arrives" },
  { icon: Package, title: "Dhaka ৳80", text: "Outside Dhaka ৳130" },
  { icon: RefreshCcw, title: "Easy returns", text: "Call us if something is wrong" },
  { icon: ShieldCheck, title: "Secure checkout", text: "We confirm before dispatch" },
] as const;

export function TrustStrip() {
  return (
    <ul className="grid gap-6 border-y border-border bg-white py-8 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex items-start gap-3 px-4 sm:justify-center sm:px-2">
          <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
