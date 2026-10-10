import { productBySlug, toProductView } from "@bismillah/shared";
import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string | string[]; color?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-muted-foreground">Loading checkout…</div>}>
      <CheckoutContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CheckoutContent({
  searchParams,
}: {
  searchParams: Promise<{ product?: string | string[]; color?: string | string[] }>;
}) {
  const params = await searchParams;
  const slug = Array.isArray(params.product) ? params.product[0] : params.product;
  const color = Array.isArray(params.color) ? params.color[0] : params.color;
  const product = slug ? productBySlug(slug) : undefined;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <h1 className="font-display text-4xl">Checkout</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Name, phone, and district. Cash on delivery. We call before the parcel goes out.
      </p>
      <CheckoutForm product={product ? toProductView(product) : undefined} color={color ?? product?.colors[0] ?? ""} />
    </div>
  );
}
