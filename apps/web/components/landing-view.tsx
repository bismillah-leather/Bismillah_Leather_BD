import type { LandingPage } from "@bismillah/shared";
import { LandingOrderForm, type LandingProductPick } from "./landing-order-form";
import { LandingPixels } from "./landing-pixels";

function Picture({ src, alt, className }: { src: string; alt: string; className?: string }) {
  if (!src) return null;
  return <img src={src} alt={alt} className={className} />;
}

export function LandingView({
  page,
  products,
  whatsappUrl,
  onlinePay = false,
  epsPay = false,
  sslPay = false,
}: {
  page: LandingPage;
  onlinePay?: boolean;
  epsPay?: boolean;
  sslPay?: boolean;
  products: LandingProductPick[];
  whatsappUrl: string;
}) {
  const whatsapp = `${whatsappUrl}?text=${encodeURIComponent(`Order: ${page.headline}`)}`;
  const secondaryIsLink = page.secondaryHref.startsWith("http") || (page.secondaryHref.startsWith("/") && page.secondaryHref !== "/");

  return (
    <article className="bg-white pb-24 text-black md:pb-0">
      <LandingPixels facebookPixelId={page.facebookPixelId} tiktokPixelId={page.tiktokPixelId} />

      <section className="bg-black text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-20">
          <div>
            <p className="text-[11px] tracking-[0.22em] text-white/60 uppercase">{page.eyebrow}</p>
            <h1 className="font-display mt-4 text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {page.headline}
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/75 sm:text-base">{page.subhead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#order"
                className="inline-flex h-12 items-center justify-center bg-white px-6 text-sm font-medium text-black"
              >
                {page.orderButton === "Place order" ? "Order now" : page.orderButton}
              </a>
              <a
                href={secondaryIsLink ? page.secondaryHref : whatsapp}
                className="inline-flex h-12 items-center justify-center border border-white/30 px-6 text-sm text-white"
                {...(secondaryIsLink ? {} : { target: "_blank", rel: "noreferrer" })}
              >
                {secondaryIsLink ? page.secondaryLabel : "WhatsApp"}
              </a>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden bg-neutral-900 sm:aspect-[5/4] lg:aspect-[4/5]">
            <Picture src={page.heroImage} alt="" className="size-full object-cover" />
          </div>
        </div>
      </section>

      {page.offer ? (
        <p className="border-b border-black/10 bg-neutral-100 px-4 py-3 text-center text-xs tracking-wide text-neutral-700 sm:text-sm">
          {page.offer}
        </p>
      ) : null}

      {page.stats.length > 0 ? (
        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-px bg-black/10 sm:grid-cols-3">
          {page.stats.map((stat) => (
            <div key={`${stat.value}-${stat.label}`} className="bg-white px-6 py-8 text-center">
              <p className="font-display text-3xl tracking-tight sm:text-4xl">{stat.value}</p>
              <p className="mt-2 text-xs tracking-[0.14em] text-neutral-500 uppercase">{stat.label}</p>
            </div>
          ))}
        </section>
      ) : null}

      {page.benefits.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">{page.benefitsTitle}</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.benefits.map((benefit) => (
              <li key={benefit.title} className="overflow-hidden border border-black/10 bg-white">
                {benefit.image ? <img src={benefit.image} alt="" className="aspect-[4/3] w-full object-cover" /> : null}
                <div className="p-5">
                  <h3 className="text-base font-medium">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{benefit.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="bg-neutral-50">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div className="relative aspect-[4/5] overflow-hidden bg-neutral-200">
            <Picture src={page.storyImage} alt="" className="size-full object-cover" />
          </div>
          <div>
            <p className="text-[11px] tracking-[0.2em] text-neutral-500 uppercase">{page.storyEyebrow}</p>
            <h2 className="font-display mt-3 text-3xl tracking-tight sm:text-4xl">{page.storyTitle}</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-700">{page.storyBody}</p>
          </div>
        </div>
      </section>

      {page.quotes.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">{page.quotesTitle}</h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {page.quotes.map((quote) => (
              <li key={`${quote.name}-${quote.quote}`} className="bg-black p-6 text-white">
                <div className="flex items-center gap-3">
                  {quote.image ? <img src={quote.image} alt="" className="size-12 object-cover" /> : null}
                  <p className="text-sm text-white/70">
                    {quote.name}
                    {quote.detail ? ` · ${quote.detail}` : ""}
                  </p>
                </div>
                <p className="mt-4 text-lg leading-8">“{quote.quote}”</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <LandingOrderForm
        landingPath={`/l/${page.slug}`}
        title={page.orderTitle}
        note={page.orderNote}
        button={page.orderButton}
        products={products}
        onlinePay={onlinePay}
        epsPay={epsPay}
        sslPay={sslPay}
      />

      {page.faqs.length > 0 ? (
        <section className="border-t border-black/10">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
            <h2 className="font-display text-3xl tracking-tight">{page.faqTitle}</h2>
            <div className="mt-6 divide-y divide-black/10 border-y border-black/10">
              {page.faqs.map((faq) => (
                <details key={faq.question} className="group py-4">
                  <summary className="cursor-pointer list-none text-base font-medium">{faq.question}</summary>
                  <p className="pt-2 text-sm leading-6 text-neutral-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-black text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
          <h2 className="font-display text-3xl tracking-tight sm:text-5xl">{page.closingTitle}</h2>
          <p className="mt-4 text-sm leading-7 text-white/70">{page.closingBody}</p>
          <a
            href="#order"
            className="mt-8 inline-flex h-12 items-center justify-center bg-white px-6 text-sm font-medium text-black"
          >
            Order now
          </a>
        </div>
      </section>

      <a
        href="#order"
        className="fixed bottom-4 left-4 z-40 inline-flex h-12 items-center bg-black px-5 text-sm font-medium text-white md:hidden"
      >
        Order now
      </a>
    </article>
  );
}
