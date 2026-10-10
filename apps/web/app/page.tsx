import { BRAND, INITIAL_CATEGORIES, SHOWCASE_PRODUCTS } from "@bismillah/shared";
import Link from "next/link";
import { HeroSlider } from "@/components/hero-slider";
import { ProductGrid } from "@/components/product-grid";
import { ProductPhoto } from "@/components/leather-visual";
import { CenteredRuleHeading, SectionHeading } from "@/components/section-heading";
import { TrustStrip } from "@/components/trust-strip";

const featured = [
  { slug: "long-wallet", name: "Long Wallet", image: "/catalog/wallet-black-long.jpg" },
  { slug: "trifold-wallet", name: "RFID Trifold", image: "/catalog/wallet-black-short.jpg" },
  { slug: "formal-belt", name: "Formal Belt", image: "/catalog/belt-black-formal.jpg" },
  { slug: "mini-wallet", name: "Mini Wallet", image: "/catalog/wallet-cognac-mini.jpg" },
] as const;

const moreCategories = [
  { slug: "thara-wallet", name: "Thara Wallet", image: "/catalog/wallet-brown-long.jpg" },
  { slug: "semi-long-wallet", name: "Three Quarter", image: "/catalog/wallet-espresso.jpg" },
  { slug: "buffalo-wallet", name: "Buffalo Wallet", image: "/catalog/wallet-buffalo.jpg" },
  { slug: "jeans-belt", name: "Jeans Belt", image: "/catalog/belt-tan-jeans.jpg" },
] as const;

const ticker = [
  ...INITIAL_CATEGORIES.map((category) => category.name),
  ...INITIAL_CATEGORIES.map((category) => category.name),
];

const newArrivals = SHOWCASE_PRODUCTS.slice(0, 4);
const bestSellers = SHOWCASE_PRODUCTS.filter((product) => product.salePaisa).slice(0, 4);
const saleItems = SHOWCASE_PRODUCTS.filter((product) => product.salePaisa);
const popularChips = [
  { href: "/search", label: "All" },
  { href: "/category/long-wallet", label: "Wallets" },
  { href: "/category/formal-belt", label: "Belts" },
  { href: "/search?q=sale", label: "Sale" },
] as const;

export default function HomePage() {
  return (
    <div>
      <HeroSlider />

      <div className="overflow-hidden bg-foreground text-background">
        <p className="sr-only">Categories</p>
        <div className="marquee-track flex w-max gap-8 py-3 text-[11px] tracking-[0.22em] uppercase">
          {ticker.map((name, index) => (
            <span key={`${name}-${index}`} className="shrink-0">
              {name}
            </span>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <CenteredRuleHeading>Featured categories</CenteredRuleHeading>
        <ul className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {featured.map((category) => (
            <li key={category.slug}>
              <Link href={`/category/${category.slug}`} className="group relative block overflow-hidden">
                <ProductPhoto src={category.image} alt={category.name} sizes="(min-width: 1024px) 25vw, 50vw" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 pt-16 pb-5 text-lg font-medium tracking-wide text-white sm:text-xl">
                  {category.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <CenteredRuleHeading>Why shop with us</CenteredRuleHeading>
          <div className="mt-8">
            <TrustStrip />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHeading
          title="New arrivals"
          action={
            <Link href="/search" className="text-sm tracking-wide underline underline-offset-4">
              Shop all
            </Link>
          }
        />
        <ProductGrid products={newArrivals} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20">
        <SectionHeading
          title="Best sellers"
          action={
            <Link href="/search?q=sale" className="text-sm tracking-wide underline underline-offset-4">
              View sale
            </Link>
          }
        />
        <ProductGrid products={bestSellers} />
      </section>

      <section className="bg-[#efeae3] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <CenteredRuleHeading>Shop by style</CenteredRuleHeading>
          <ul className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {moreCategories.map((category) => (
              <li key={category.slug}>
                <Link href={`/category/${category.slug}`} className="group relative block overflow-hidden">
                  <ProductPhoto src={category.image} alt={category.name} />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pt-14 pb-4 text-base font-medium text-white">
                    {category.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHeading
          title="New and popular"
          action={
            <Link href="/search" className="text-sm tracking-wide underline underline-offset-4">
              Shop all
            </Link>
          }
        />
        <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
          {popularChips.map((chip, index) => (
            <Link
              key={chip.href}
              href={chip.href}
              className={`inline-flex h-11 shrink-0 items-center border px-4 text-sm ${
                index === 0
                  ? "border-foreground bg-foreground text-background"
                  : "border-input bg-white"
              }`}
            >
              {chip.label}
            </Link>
          ))}
        </div>
        <ProductGrid products={SHOWCASE_PRODUCTS} />
      </section>

      <section className="border-y border-border bg-[#1a1511] text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mb-10 max-w-xl">
            <p className="text-xs tracking-[0.28em] text-white/65 uppercase">On sale</p>
            <h2 className="font-display mt-3 text-4xl sm:text-6xl">Marked down this week</h2>
            <p className="mt-4 text-sm leading-6 text-white/75">
              Sale prices on selected wallets and belts. Share the product link from Facebook or
              TikTok and customers land on the same page.
            </p>
            <Link
              href="/search?q=sale"
              className="mt-8 inline-flex h-12 items-center bg-white px-5 text-sm font-medium text-black"
            >
              Shop sale
            </Link>
          </div>
          <div className="rounded-sm bg-[#f6f3ee] p-4 text-foreground sm:p-6">
            <ProductGrid products={saleItems.slice(0, 4)} />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">Visit us</p>
            <h2 className="font-display mt-3 text-4xl sm:text-5xl">Mirpur-10 showroom</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
              {BRAND.addressLine}. Same genuine leather pieces you see on Facebook Reels — RFID
              trifold, magnetic long wallet, thara soft leather, mini magnetic, belts.
            </p>
            <ul className="mt-6 grid gap-2 text-sm">
              <li>
                Phone:{" "}
                <a className="underline underline-offset-4" href={`tel:${BRAND.phoneE164}`}>
                  {BRAND.phoneDisplay}
                </a>
              </li>
              <li>
                WhatsApp:{" "}
                <a className="underline underline-offset-4" href={BRAND.whatsappUrl} target="_blank" rel="noreferrer">
                  Message now
                </a>
              </li>
              <li>
                Email:{" "}
                <a className="underline underline-offset-4" href={`mailto:${BRAND.email}`}>
                  {BRAND.email}
                </a>
              </li>
              <li>
                Facebook:{" "}
                <a className="underline underline-offset-4" href={BRAND.facebookUrl} target="_blank" rel="noreferrer">
                  Bismillah leather
                </a>
              </li>
            </ul>
          </div>
          <div className="border border-border bg-[#f6f3ee] p-6 sm:p-8">
            <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">Stay close</p>
            <h3 className="font-display mt-3 text-3xl">New drop alerts</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {BRAND.taglineBn}. Share any product link from Messenger or WhatsApp — customer lands
              on the same page.
            </p>
            <form className="mt-6 flex flex-col gap-3 sm:flex-row" action="/search">
              <label className="sr-only" htmlFor="newsletter">
                Email or phone
              </label>
              <input
                id="newsletter"
                name="q"
                placeholder="Email or phone"
                className="h-12 flex-1 border border-input bg-white px-4 text-sm outline-none focus-visible:border-foreground"
              />
              <button type="submit" className="h-12 bg-foreground px-5 text-sm font-medium text-background">
                Notify me
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
