import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl">Bismillah Leather</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Wallets and belts. Cash on delivery across Bangladesh.
          </p>
        </div>
        <div className="text-sm">
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Shop</p>
          <ul className="mt-3 grid gap-2">
            <li>
              <Link className="hover:text-primary" href="/category/long-wallet">
                Wallets
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary" href="/category/formal-belt">
                Belts
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Policies</p>
          <ul className="mt-3 grid gap-2">
            <li>
              <Link className="hover:text-primary" href="/policies/shipping">
                Shipping
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary" href="/policies/returns">
                Returns
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary" href="/policies/privacy">
                Privacy
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} Bismillah Leather
      </div>
    </footer>
  );
}
