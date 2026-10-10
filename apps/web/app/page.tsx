import { INITIAL_CATEGORIES } from "@bismillah/shared";
import { Badge, Button } from "@bismillah/ui";
import Link from "next/link";

const groups = ["Wallets", "Belts"] as const;

export default function HomePage() {
  return (
    <div>
      <section className="px-4 pt-12 pb-10 sm:px-6 sm:pt-20 sm:pb-16">
        <div className="mx-auto max-w-6xl">
          <Badge variant="outline">Cash on delivery</Badge>
          <h1 className="font-display mt-5 max-w-3xl text-[2.6rem] leading-[0.95] tracking-tight sm:text-7xl">
            Leather, cut to last.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Wallets and belts from Bismillah Leather. New pieces are added every day, and checkout
            stays short: name, phone, district, done.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/category/long-wallet">Shop wallets</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/category/formal-belt">Shop belts</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <ul className="mx-auto grid max-w-6xl gap-4 px-4 py-6 text-sm sm:grid-cols-3 sm:px-6">
          <li>Cash on delivery nationwide</li>
          <li>Price and stock checked on the server</li>
          <li>Orders confirmed by phone before dispatch</li>
        </ul>
      </section>

      {groups.map((group) => (
        <section key={group} className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-3xl sm:text-4xl">{group}</h2>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {INITIAL_CATEGORIES.filter((category) => category.group === group).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="flex min-h-36 flex-col justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
                  >
                    <span className="text-xs tracking-[0.16em] text-primary uppercase">
                      {String(category.sortOrder / 10).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="font-display block text-xl leading-tight">{category.name}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{category.blurb}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
    </div>
  );
}
