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
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground sm:px-6">
          Loading checkout…
        </div>
      }
    >
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
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">Cash on delivery</p>
      <h1 className="font-display mt-2 text-4xl tracking-tight sm:text-5xl">Checkout</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        Pick your color and district, then leave name, phone, and address. We call before the
        parcel goes out.
      </p>
      <CheckoutForm
        product={product ? toProductView(product) : undefined}
        color={color ?? product?.colors[0] ?? ""}
      />
    </div>
  );
}
