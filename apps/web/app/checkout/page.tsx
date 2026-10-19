import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="min-h-[70vh] bg-secondary/20 py-6 sm:py-10">
      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl px-4 text-sm text-muted-foreground sm:px-6">
            Loading checkout…
          </div>
        }
      >
        <div className="px-4 sm:px-6">
          <CheckoutForm />
        </div>
      </Suspense>
    </div>
  );
}
