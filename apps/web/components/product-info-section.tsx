"use client";

import { type ProductView } from "@bismillah/shared";
import { ChevronDown, MapPin, Package, ShieldCheck, Truck } from "lucide-react";
import { useId, useState } from "react";
import { useStoreBrand } from "./brand-provider";
import { ProductVideo } from "./product-video";

type TabId = "description" | "shipping" | "care" | "returns";

const TABS: { id: TabId; label: string }[] = [
  { id: "description", label: "Description" },
  { id: "shipping", label: "Shipping" },
  { id: "care", label: "Leather care" },
  { id: "returns", label: "Returns & COD" },
];

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3 border-b border-border/80 py-2.5 text-sm last:border-b-0 sm:grid-cols-[7.5rem_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="capitalize text-foreground">{value}</dd>
    </div>
  );
}

function DetailsCard({ product }: { product: ProductView }) {
  const categoryLabel = product.categorySlug.replaceAll("-", " ");
  const material = product.kind === "belt" ? "Genuine leather strap" : "Full-grain leather";

  return (
    <div className="border border-border bg-white px-4 py-2 sm:px-5">
      <p className="pt-3 text-xs tracking-[0.2em] text-muted-foreground uppercase">Details</p>
      <dl className="mt-1">
        <SpecRow label="SKU" value={product.sku} />
        <SpecRow label="Category" value={categoryLabel} />
        <SpecRow label="Material" value={material} />
        <SpecRow label="Colors" value={product.colors.join(" · ")} />
        <SpecRow label="Stock" value={product.inStock ? "Ready to ship" : "Sold out"} />
      </dl>
    </div>
  );
}

function DescriptionTabs({ product }: { product: ProductView }) {
  const uid = useId();
  const [tab, setTab] = useState<TabId>("description");
  const [mobileOpen, setMobileOpen] = useState<TabId | null>("description");

  return (
    <>
      {/* Desktop tabs */}
      <div className="hidden h-full border border-border bg-white lg:flex lg:flex-col">
        <div role="tablist" aria-label="Product information" className="flex border-b border-border">
          {TABS.map((item) => {
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`${uid}-${item.id}`}
                aria-selected={selected}
                aria-controls={`${uid}-${item.id}-panel`}
                onClick={() => setTab(item.id)}
                className={`relative flex-1 px-2 py-3.5 text-xs transition sm:px-3 sm:text-sm ${
                  selected
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
                {selected ? (
                  <span aria-hidden className="absolute inset-x-2 -bottom-px h-0.5 bg-foreground sm:inset-x-3" />
                ) : null}
              </button>
            );
          })}
        </div>
        <div
          role="tabpanel"
          id={`${uid}-${tab}-panel`}
          aria-labelledby={`${uid}-${tab}`}
          className="flex-1 px-5 py-6"
        >
          <TabBody tab={tab} product={product} />
        </div>
      </div>

      {/* Mobile accordion */}
      <div className="border border-border bg-white lg:hidden">
        {TABS.map((item) => {
          const open = mobileOpen === item.id;
          return (
            <div key={item.id} className="border-b border-border last:border-b-0">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm font-medium"
                aria-expanded={open}
                onClick={() => setMobileOpen(open ? null : item.id)}
              >
                {item.label}
                <ChevronDown
                  className={`size-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
                />
              </button>
              {open ? (
                <div className="border-t border-border px-4 py-5">
                  <TabBody tab={item.id} product={product} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}

export function ProductInfoSection({ product }: { product: ProductView }) {
  const brand = useStoreBrand();
  const hasVideo = Boolean(product.videoUrl?.trim());

  return (
    <div className="product-info">
      <ul className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border sm:grid-cols-4">
        {[
          { icon: Package, title: "Handmade", sub: "Mirpur-10 pack" },
          { icon: Truck, title: "COD ready", sub: "All Bangladesh" },
          { icon: ShieldCheck, title: "Confirm call", sub: "Before courier" },
          { icon: MapPin, title: "Showroom", sub: brand.addressShort },
        ].map((item) => (
          <li
            key={item.title}
            className="flex items-start gap-3 bg-white px-3.5 py-4 sm:px-4 sm:py-5"
          >
            <item.icon className="mt-0.5 size-4 shrink-0 text-foreground" strokeWidth={1.6} />
            <div>
              <p className="text-sm font-medium tracking-tight">{item.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.sub}</p>
            </div>
          </li>
        ))}
      </ul>

      {/*
        No video → Details | Description (two columns)
        Has video → (Details + Description) | Video — video only for this product
      */}
      {hasVideo ? (
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <div className="grid gap-6">
            <DetailsCard product={product} />
            <DescriptionTabs product={product} />
          </div>
          <aside className="lg:sticky lg:top-[calc(var(--site-header-offset,7rem)+0.75rem)]">
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Product film</p>
            <p className="mt-1 mb-3 text-sm text-muted-foreground">
              Only on this product — from our Facebook / YouTube.
            </p>
            <ProductVideo
              videoUrl={product.videoUrl}
              productName={product.name}
              variant="inline"
            />
          </aside>
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
          <DetailsCard product={product} />
          <DescriptionTabs product={product} />
        </div>
      )}
    </div>
  );
}

function TabBody({ tab, product }: { tab: TabId; product: ProductView }) {
  if (tab === "description") {
    return (
      <div>
        <p className="text-[15px] leading-7 text-foreground/90">{product.blurb}</p>
        <ul className="mt-5 grid gap-2.5">
          {product.highlights.map((line) => (
            <li key={line} className="flex gap-3 text-sm leading-6 text-muted-foreground">
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-foreground" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (tab === "shipping") {
    return (
      <div className="grid gap-3 text-sm leading-7 text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Inside Dhaka ৳80</span>
          {" · "}
          <span className="font-medium text-foreground">Outside Dhaka ৳130</span>
        </p>
        <p>We call to confirm before Pathao / Steadfast / RedX booking.</p>
        <p>Delivery and courier booking confirm after we call you.</p>
      </div>
    );
  }

  if (tab === "care") {
    return (
      <ul className="grid gap-2.5 text-sm leading-7 text-muted-foreground">
        <li>Wipe with a soft dry cloth. Avoid soaking.</li>
        <li>Keep away from direct heat and long sun.</li>
        <li>Natural marks and grain variation are part of genuine leather.</li>
      </ul>
    );
  }

  return (
    <ul className="grid gap-2.5 text-sm leading-7 text-muted-foreground">
      <li>Cash on delivery across Bangladesh.</li>
      <li>Confirm on the call — we pack after you say yes.</li>
      <li>
        Issues after delivery? Call us with your order number — we sort it from Mirpur-10.
      </li>
    </ul>
  );
}
