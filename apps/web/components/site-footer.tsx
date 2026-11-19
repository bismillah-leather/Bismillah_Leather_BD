import { INITIAL_CATEGORIES, type StoreBrand } from "@bismillah/shared";
import Link from "next/link";
import { BrandLogo } from "./brand-logo";

export function SiteFooter({ brand }: { brand: StoreBrand }) {
  return (
    <footer className="mt-8 border-t border-border bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-3">
            <BrandLogo size={44} className="h-10 w-10" />
            <span className="font-display text-lg sm:text-xl">{brand.name}</span>
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{brand.tagline}</p>
          <p className="mt-4 text-sm text-muted-foreground">{brand.addressLine}</p>
          <p className="mt-2 text-sm">
            <a className="hover:underline" href={`tel:${brand.phoneE164}`}>
              {brand.phoneDisplay}
            </a>
          </p>
          <p className="mt-1 text-sm">
            <a className="hover:underline" href={`mailto:${brand.email}`}>
              {brand.email}
            </a>
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a
              className="underline underline-offset-4"
              href={brand.whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
            <a
              className="underline underline-offset-4"
              href={brand.facebookUrl}
              target="_blank"
              rel="noreferrer"
            >
              Facebook
            </a>
            {brand.youtubeUrl ? (
              <a
                className="underline underline-offset-4"
                href={brand.youtubeUrl}
                target="_blank"
                rel="noreferrer"
              >
                YouTube
              </a>
            ) : null}
          </div>
        </div>
        <div>
          <p className="text-xs tracking-[0.16em] uppercase">Top categories</p>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {INITIAL_CATEGORIES.map((category) => (
              <li key={category.slug}>
                <Link className="hover:text-foreground" href={`/category/${category.slug}`}>
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[0.16em] uppercase">Information</p>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <li>
              <Link className="hover:text-foreground" href="/about">
                About
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/policies/shipping">
                Shipping policy
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/policies/returns">
                Returns & exchanges
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/policies/privacy">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/cart">
                Cart
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/account">
                My account
              </Link>
            </li>
            <li>
              <a className="hover:text-foreground" href="/admin">
                Staff / admin
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[0.16em] uppercase">Visit & order</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {brand.followersLabel} · {brand.recommendLabel}. {brand.codNote || "Cash on delivery across Bangladesh."}{" "}
            Visit the Mirpur shop or order online and we call to confirm.
          </p>
          {brand.shippingNote ? (
            <p className="mt-2 text-sm text-muted-foreground">{brand.shippingNote}</p>
          ) : null}
          <a
            href={brand.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex h-11 items-center bg-foreground px-4 text-sm font-medium text-background"
          >
            Message on WhatsApp
          </a>
        </div>
      </div>
      <div className="border-t border-border bg-[#fafafa]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="overflow-x-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/payments/eps-footer-desktop.png"
              alt="Pay with Visa, Mastercard, bKash, Nagad and EPS"
              className="mx-auto hidden h-11 w-auto max-w-full object-contain object-center sm:block lg:h-12"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/payments/eps-footer-mobile.png"
              alt="Pay with EPS"
              className="mx-auto h-10 w-auto max-w-full object-contain sm:hidden"
            />
          </div>
          <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">
            © 2026 {brand.name} · {brand.addressShort} · Cash on delivery or Pay with EPS
          </p>
        </div>
      </div>
    </footer>
  );
}
