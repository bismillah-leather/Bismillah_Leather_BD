import Link from "next/link";
import { AllProductsSection } from "@/components/all-products-section";
import { BestSellersSection } from "@/components/best-sellers-section";
import { BrandMarquee } from "@/components/brand-marquee";
import { CatalogFilterProvider } from "@/components/catalog-filter";
import { FeaturedCategoryRail } from "@/components/featured-category-rail";
import { HeroSlider } from "@/components/hero-slider";
import { HomeFlashSale } from "@/components/home-flash-sale";
import { NewArrivalsSection } from "@/components/new-arrivals-section";
import { ProductPhoto } from "@/components/leather-visual";
import { CenteredRuleHeading } from "@/components/section-heading";
import { TrustStrip } from "@/components/trust-strip";
import { listPublishedProducts } from "@/lib/catalog";
import { getStoreBrand } from "@/lib/store-brand";
import { getStorefrontContent } from "@/lib/storefront-content";

const moreCategories = [
  { slug: "thara-wallet", name: "Thara Wallet", image: "/catalog/wallet-brown-long.jpg" },
  { slug: "semi-long-wallet", name: "Three Quarter", image: "/catalog/wallet-espresso.jpg" },
  { slug: "buffalo-wallet", name: "Buffalo Wallet", image: "/catalog/wallet-buffalo.jpg" },
  { slug: "jeans-belt", name: "Jeans Belt", image: "/catalog/belt-tan-jeans.jpg" },
] as const;

export default async function HomePage() {
  const [brand, products, content] = await Promise.all([
    getStoreBrand(),
    listPublishedProducts(),
    getStorefrontContent(),
  ]);

  return (
    <div>
      <HeroSlider slides={content.hero} />

      <BrandMarquee />

      <CatalogFilterProvider>
        <section className="bg-white py-6 sm:py-8">
          <div className="mx-auto max-w-7xl px-3 sm:px-6">
            <CenteredRuleHeading size="lg">Featured categories</CenteredRuleHeading>
            <div className="mt-4 sm:mt-5">
              <FeaturedCategoryRail items={content.featured} />
            </div>
          </div>
        </section>

        <AllProductsSection products={products} />

        <HomeFlashSale />

        <NewArrivalsSection products={products} />

        <BestSellersSection products={products} />


        <section className="border-y border-border bg-white py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-3 sm:px-6">
            <CenteredRuleHeading size="lg">Why shop with us</CenteredRuleHeading>
            <div className="mt-6 sm:mt-8">
              <TrustStrip items={content.trust} />
            </div>
          </div>
        </section>

        <section className="bg-secondary py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-3 sm:px-6">
            <CenteredRuleHeading>Shop by style</CenteredRuleHeading>
            <ul className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3 lg:grid-cols-4">
              {moreCategories.map((category) => (
                <li key={category.slug}>
                  <Link href={`/category/${category.slug}`} className="group relative block overflow-hidden">
                    <ProductPhoto src={category.image} alt={category.name} />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2.5 pt-10 pb-2.5 text-xs font-medium text-white sm:px-3 sm:pt-12 sm:pb-3 sm:text-sm">
                      {category.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-border bg-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-3 py-8 sm:gap-8 sm:px-6 sm:py-12 lg:grid-cols-2 lg:py-14">
            <div>
              <p className="text-[10px] tracking-[0.28em] text-muted-foreground uppercase sm:text-[11px]">
                Visit us
              </p>
              <h2 className="font-display mt-2 text-xl tracking-tight sm:text-2xl md:text-3xl">
                Mirpur-10 showroom
              </h2>
              <p className="mt-3 max-w-md text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                {brand.addressLine}. Same genuine leather pieces you see on Facebook Reels — RFID
                trifold, magnetic long wallet, thara soft leather, mini magnetic, belts.
              </p>
              <ul className="mt-4 grid gap-1.5 text-xs sm:text-sm">
                <li>
                  Phone:{" "}
                  <a className="underline underline-offset-4" href={`tel:${brand.phoneE164}`}>
                    {brand.phoneDisplay}
                  </a>
                </li>
                <li>
                  WhatsApp:{" "}
                  <a
                    className="underline underline-offset-4"
                    href={brand.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Message now
                  </a>
                </li>
                <li>
                  Email:{" "}
                  <a className="underline underline-offset-4" href={`mailto:${brand.email}`}>
                    {brand.email}
                  </a>
                </li>
                <li>
                  Facebook:{" "}
                  <a
                    className="underline underline-offset-4"
                    href={brand.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Bismillah leather
                  </a>
                </li>
              </ul>
            </div>
            <div className="border border-border bg-secondary p-4 sm:p-6">
              <p className="text-[10px] tracking-[0.28em] text-muted-foreground uppercase sm:text-[11px]">
                Stay close
              </p>
              <h3 className="font-display mt-2 text-xl tracking-tight sm:text-2xl">New drop alerts</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                {brand.taglineBn}. Share any product link from Messenger or WhatsApp — customer lands
                on the same page.
              </p>
              {brand.announcement ? (
                <p className="mt-3 text-xs font-medium text-foreground sm:text-sm">{brand.announcement}</p>
              ) : null}
              <form className="mt-4 flex flex-col gap-2.5 sm:flex-row" action="/search">
                <label className="sr-only" htmlFor="newsletter">
                  Email or phone
                </label>
                <input
                  id="newsletter"
                  name="q"
                  placeholder="Email or phone"
                  className="h-10 flex-1 border border-border bg-white px-3 text-sm outline-none focus:border-foreground"
                />
                <button
                  type="submit"
                  className="h-10 bg-foreground px-4 text-xs font-medium tracking-wide text-background uppercase"
                >
                  Notify me
                </button>
              </form>
            </div>
          </div>
        </section>
      </CatalogFilterProvider>
    </div>
  );
}
