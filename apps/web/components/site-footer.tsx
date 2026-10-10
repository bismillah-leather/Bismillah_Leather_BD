import { INITIAL_CATEGORIES } from "@bismillah/shared";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-border bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <p className="font-display text-2xl">Bismillah Leather</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Wallets and belts. Cash on delivery across Bangladesh.
          </p>
        </div>
        <div>
          <p className="text-xs tracking-[0.16em] uppercase">Shop</p>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {INITIAL_CATEGORIES.slice(0, 5).map((category) => (
              <li key={category.slug}>
                <Link className="hover:text-foreground" href={`/category/${category.slug}`}>
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[0.16em] uppercase">Policies</p>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <li>
              <Link className="hover:text-foreground" href="/policies/shipping">
                Shipping
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/policies/returns">
                Returns
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/policies/privacy">
                Privacy
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[0.16em] uppercase">Checkout</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Name, phone, and district. We call to confirm cash-on-delivery orders before dispatch.
          </p>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        © 2026 Bismillah Leather
      </div>
    </footer>
  );
}
