import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { BrandProvider } from "@/components/brand-provider";
import { CartDrawer } from "@/components/cart-drawer";
import { CartProvider } from "@/components/cart-provider";
import { FloatingContact } from "@/components/floating-contact";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getStoreBrand } from "@/lib/store-brand";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getStoreBrand();
  return {
    title: {
      default: brand.name,
      template: `%s · ${brand.name}`,
    },
    description: `${brand.tagline}. ${brand.addressLine}. Call ${brand.phoneDisplay}. Cash on delivery across Bangladesh.`,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const brand = await getStoreBrand();

  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} storefront h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <BrandProvider brand={brand}>
          <CartProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
            >
              Skip to content
            </a>
            <SiteHeader brand={brand} />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter brand={brand} />
            <CartDrawer />
            <FloatingContact />
          </CartProvider>
        </BrandProvider>
      </body>
    </html>
  );
}
