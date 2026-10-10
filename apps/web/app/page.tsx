import { INITIAL_CATEGORIES, SHOWCASE_PRODUCTS } from "@bismillah/shared";
import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/product-grid";
import { ProductPhoto } from "@/components/leather-visual";

const featured = [
  { slug: "long-wallet", name: "Long Wallet", image: "/catalog/wallet-black-long.jpg" },
  { slug: "short-wallet", name: "Short Wallet", image: "/catalog/wallet-black-short.jpg" },
  { slug: "formal-belt", name: "Formal Belt", image: "/catalog/belt-black-formal.jpg" },
  { slug: "jeans-belt", name: "Jeans Belt", image: "/catalog/belt-tan-jeans.jpg" },
] as const;

const ticker = [...INITIAL_CATEGORIES.map((category) => category.name), ...INITIAL_CATEGORIES.map((category) => category.name)];

export default function HomePage() {
  return (
    <div>
      <section className="relative min-h-[78vh] overflow-hidden bg-black text-white sm:min-h-[88vh]">
        <Image
          src="/catalog/hero-leather.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/35" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-end px-4 pt-16 pb-12 sm:min-h-[88vh] sm:px-6 sm:pb-16">
          <p className="text-xs tracking-[0.32em] uppercase">Bismillah Leather</p>
          <h1 className="font-display mt-4 max-w-3xl text-6xl leading-[0.88] tracking-tight sm:text-8xl">
            Hide, stitch, and carry.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/80 sm:text-base">
            Long wallets, short wallets, and belts. Open a piece, choose the color, and check out
            with cash on delivery.
          </p>
          <form action="/search" className="mt-8 max-w-xl">
            <label className="sr-only" htmlFor="hero-search">
              Search products
            </label>
            <input
              id="hero-search"
              name="q"
              placeholder='Search "long wallet"'
              className="h-12 w-full rounded-full border border-white/50 bg-white/10 px-5 text-base text-white outline-none backdrop-blur-md placeholder:text-white/70 focus-visible:border-white"
            />
          </form>
          <div className="mt-5 flex gap-3">
            <Link
              href="/category/long-wallet"
              className="inline-flex h-12 items-center bg-white px-5 text-sm font-medium text-black"
            >
              Shop wallets
            </Link>
            <Link
              href="/category/formal-belt"
              className="inline-flex h-12 items-center border border-white/70 px-5 text-sm text-white"
            >
              Shop belts
            </Link>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-foreground/10 bg-foreground text-background">
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
        <h2 className="text-center text-xs tracking-[0.28em] text-muted-foreground uppercase">
          Featured categories
        </h2>
        <ul className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {featured.map((category) => (
            <li key={category.slug}>
              <Link href={`/category/${category.slug}`} className="group relative block overflow-hidden">
                <ProductPhoto src={category.image} alt={category.name} sizes="(min-width: 1024px) 25vw, 50vw" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-4 pt-16 pb-5 text-lg font-medium text-white sm:text-xl">
                  {category.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-display text-4xl sm:text-5xl">New and popular</h2>
          <Link href="/search" className="text-sm tracking-wide underline underline-offset-4">
            Shop all
          </Link>
        </div>
        <ProductGrid products={SHOWCASE_PRODUCTS} />
      </section>
    </div>
  );
}
