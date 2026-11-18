import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout-form";
import { epsReady } from "@/lib/eps";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const epsPay = await epsReady();
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
          <CheckoutForm epsPay={epsPay} />
        </div>
      </Suspense>
    </div>
  );
}
