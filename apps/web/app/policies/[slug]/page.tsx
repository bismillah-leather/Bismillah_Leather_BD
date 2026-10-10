import type { Metadata } from "next";
import { notFound } from "next/navigation";

const POLICIES = {
  shipping: {
    title: "Shipping",
    body: [
      "Cash on delivery is available inside and outside Dhaka. The delivery charge is calculated on our server from the district you enter at checkout.",
      "A courier booking is created after the order is confirmed. You receive a tracking update when the parcel is handed over.",
    ],
  },
  returns: {
    title: "Returns",
    body: [
      "If a piece arrives damaged or is not the item you ordered, message us with your order number and we will arrange the return.",
      "Returned stock is put back through the inventory ledger, so the count you see on the site stays accurate.",
    ],
  },
  privacy: {
    title: "Privacy",
    body: [
      "We store the name, phone number, and address needed to deliver an order. Phone numbers are saved in a single format so we do not keep duplicates.",
      "Payment details stay with the payment provider. We keep the transaction reference, not your wallet PIN or card number.",
    ],
  },
} as const;

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = POLICIES[slug as keyof typeof POLICIES];
  return { title: policy?.title ?? "Policy" };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = POLICIES[slug as keyof typeof POLICIES];
  if (!policy) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl">{policy.title}</h1>
      <div className="mt-6 grid gap-4 text-base leading-7 text-muted-foreground">
        {policy.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
