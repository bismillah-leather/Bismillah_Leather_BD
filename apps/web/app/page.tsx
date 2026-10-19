import { BRAND, SHOWCASE_PRODUCTS } from "@bismillah/shared";
import Link from "next/link";
import { AllProductsSection } from "@/components/all-products-section";
import { BestSellersSection } from "@/components/best-sellers-section";
import { FeaturedCategoryRail } from "@/components/featured-category-rail";
import { HeroSlider } from "@/components/hero-slider";
import { NewArrivalsSection } from "@/components/new-arrivals-section";
import { ProductGrid } from "@/components/product-grid";
import { ProductPhoto } from "@/components/leather-visual";
import { CenteredRuleHeading } from "@/components/section-heading";
import { TrustStrip } from "@/components/trust-strip";

const featuredCategories = [
  { slug: "long-wallet", name: "Long Wallet", image: "/catalog/wallet-black-long.jpg" },
  { slug: "short-wallet", name: "Short Wallet", image: "/catalog/wallet-black-short.jpg" },
  { slug: "formal-wallet", name: "Formal Wallet", image: "/catalog/wallet-tan-formal.jpg" },
  { slug: "mini-wallet", name: "Mini Wallet", image: "/catalog/wallet-cognac-mini.jpg" },
  { slug: "trifold-wallet", name: "Trifold", image: "/catalog/wallet-black-short.jpg" },
  { slug: "semi-long-wallet", name: "Three Quarter", image: "/catalog/wallet-espresso.jpg" },
  { slug: "buffalo-wallet", name: "Buffalo", image: "/catalog/wallet-buffalo.jpg" },
  { slug: "thara-wallet", name: "Thara", image: "/catalog/wallet-brown-long.jpg" },
  { slug: "formal-belt", name: "Formal Belt", image: "/catalog/belt-black-formal.jpg" },
  { slug: "jeans-belt", name: "Jeans Belt", image: "/catalog/belt-tan-jeans.jpg" },
  { slug: "lv-wallet", name: "LV Wallet", image: "/catalog/wallet-espresso.jpg" },
] as const;

const moreCategories = [
  { slug: "thara-wallet", name: "Thara Wallet", image: "/catalog/wallet-brown-long.jpg" },
  { slug: "semi-long-wallet", name: "Three Quarter", image: "/catalog/wallet-espresso.jpg" },
  { slug: "buffalo-wallet", name: "Buffalo Wallet", image: "/catalog/wallet-buffalo.jpg" },
  { slug: "jeans-belt", name: "Jeans Belt", image: "/catalog/belt-tan-jeans.jpg" },
] as const;

const saleItems = SHOWCASE_PRODUCTS.filter((product) => product.salePaisa);

export default function HomePage() {
  return (
    <div>
      <HeroSlider />

      <section className="bg-secondary py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <CenteredRuleHeading size="lg">Featured categories</CenteredRuleHeading>
          <div className="mt-8 sm:mt-12">
            <FeaturedCategoryRail items={featuredCategories} />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-white py-14 sm:py-24">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <CenteredRuleHeading size="lg">Why shop with us</CenteredRuleHeading>
          <div className="mt-10 sm:mt-14">
            <TrustStrip />
          </div>
        </div>
      </section>

      <NewArrivalsSection />

      <BestSellersSection />

      <section className="bg-secondary py-10 sm:py-20">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <CenteredRuleHeading>Shop by style</CenteredRuleHeading>
          <ul className="mt-6 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-3 lg:grid-cols-4">
            {moreCategories.map((category) => (
              <li key={category.slug}>
                <Link href={`/category/${category.slug}`} className="group relative block overflow-hidden">
                  <ProductPhoto src={category.image} alt={category.name} />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2.5 pt-12 pb-3 text-sm font-medium text-white sm:px-4 sm:pt-14 sm:pb-4 sm:text-base">
                    {category.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <AllProductsSection />

      <section className="border-y border-border bg-black text-white">
        <div className="mx-auto max-w-7xl px-3 py-10 sm:px-6 sm:py-20">
          <div className="mb-8 max-w-xl sm:mb-10">
            <p className="text-xs tracking-[0.28em] text-white/65 uppercase">On sale</p>
            <h2 className="font-display mt-3 text-3xl sm:text-6xl">Marked down this week</h2>
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
          <div className="rounded-sm bg-white p-3 text-foreground sm:p-6">
            <ProductGrid products={saleItems.slice(0, 4)} />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-3 py-12 sm:gap-10 sm:px-6 sm:py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">Visit us</p>
            <h2 className="font-display mt-3 text-3xl sm:text-5xl">Mirpur-10 showroom</h2>
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
          <div className="border border-border bg-secondary p-6 sm:p-8">
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
