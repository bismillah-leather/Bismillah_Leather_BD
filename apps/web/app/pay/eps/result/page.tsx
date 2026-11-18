import { getPrisma } from "@bismillah/db";
import { formatPaisa } from "@bismillah/shared";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment",
  robots: { index: false, follow: false },
};

export default async function EpsResultPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; token?: string; state?: string }>;
}) {
  const sp = await searchParams;
  const orderNumber = sp.order?.trim() ?? "";
  const token = sp.token?.trim() ?? "";
  const payment =
    orderNumber || token
      ? await getPrisma().payment.findFirst({
          where: {
            provider: "eps",
            ...(orderNumber ? { order: { number: orderNumber } } : {}),
            ...(token ? { rawPayload: { path: ["payToken"], equals: token } } : {}),
          },
          orderBy: { createdAt: "desc" },
          select: {
            status: true,
            amount: true,
            order: { select: { number: true, paymentStatus: true } },
          },
        })
      : null;

  const paid = payment?.order.paymentStatus === "paid" || payment?.status === "paid";
  const cancelled = !paid && sp.state === "cancelled";
  const title = paid ? "Payment received" : cancelled ? "Payment cancelled" : "Payment not completed";
  const copy = paid
    ? "EPS confirmed this payment. We will pack after a quick check."
    : cancelled
      ? "You closed the payment page. The order is saved. Use COD or try Pay with EPS again."
      : "The payment did not go through. If money left your wallet, keep this order number and call the shop.";

  return (
    <div className="min-h-[70vh] bg-secondary/20 px-4 py-10">
      <div className="mx-auto max-w-xl border border-border bg-white">
        <div className="bg-black px-6 py-10 text-white sm:px-8">
          <p className="text-[11px] tracking-[0.22em] text-white/50 uppercase">Pay with EPS</p>
          <h1 className="font-display mt-3 text-4xl tracking-tight">{title}</h1>
          <p className="mt-4 text-sm leading-6 text-white/70">{copy}</p>
          {payment ? (
            <p className="mt-4 text-lg font-medium">
              {payment.order.number} · {formatPaisa(payment.amount)}
            </p>
          ) : (
            <p className="mt-4 text-sm text-white/70">We could not match this return to an order.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3 p-6 sm:p-8">
          <Link href="/" className="inline-flex h-12 items-center bg-foreground px-5 text-sm font-medium text-background">
            Back to shop
          </Link>
          {!paid ? (
            <Link href="/checkout" className="inline-flex h-12 items-center border border-foreground px-5 text-sm font-medium">
              Checkout again
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
