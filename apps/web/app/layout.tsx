import type { Metadata, Viewport } from "next";

export const dynamic = "force-dynamic";
import { Fraunces, Outfit } from "next/font/google";
import { BrandProvider } from "@/components/brand-provider";
import { CartDrawer } from "@/components/cart-drawer";
import { CartProvider } from "@/components/cart-provider";
import { JsonLd } from "@/components/json-ld";
import { LiveViewersProvider } from "@/components/live-viewers";
import { FloatingContact } from "@/components/floating-contact";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrackingNoscript, TrackingScripts } from "@/components/tracking-scripts";
import { keywordList, getSeoConfig } from "@/lib/seo";
import { absoluteUrl, publicStoreOrigin } from "@/lib/site-origin";
import { DEFAULT_OG_IMAGE, ogImageTags, shareImageUrl } from "@/lib/social-preview";
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
  const [brand, seo, origin] = await Promise.all([
    getStoreBrand(),
    getSeoConfig(),
    publicStoreOrigin(),
  ]);
  const title = seo.seoTitle || `${brand.name} · leather wallets & belts in Dhaka`;
  const description =
    seo.seoDescription ||
    `${brand.tagline}. Genuine leather wallets and belts from ${brand.addressShort}. Cash on delivery across Bangladesh. Call ${brand.phoneDisplay}.`;
  const keywords = keywordList(seo.seoKeywords);
  const ogImage = shareImageUrl(origin, DEFAULT_OG_IMAGE);

  return {
    metadataBase: new URL(origin),
    title: {
      default: title,
      template: `%s · ${brand.name}`,
    },
    description,
    keywords,
    icons: {
      icon: [
        { url: "/icon.png", type: "image/png", sizes: "48x48" },
        { url: "/apple-icon.png", type: "image/png", sizes: "180x180" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
      shortcut: "/icon.png",
    },
    applicationName: brand.name,
    authors: [{ name: brand.name }],
    creator: brand.name,
    publisher: brand.name,
    category: "shopping",
    alternates: { canonical: origin },
    robots: { index: true, follow: true },
    verification: {
      google: seo.googleSiteVerification || undefined,
      other: seo.bingSiteVerification
        ? { "msvalidate.01": seo.bingSiteVerification }
        : undefined,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: origin,
      siteName: brand.name,
      title,
      description,
      images: ogImageTags(ogImage, `${brand.name} leather wallet`),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [brand, seo, origin] = await Promise.all([
    getStoreBrand(),
    getSeoConfig(),
    publicStoreOrigin(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Store", "LocalBusiness"],
        "@id": `${origin}/#store`,
        name: brand.name,
        url: origin,
        image: shareImageUrl(origin, DEFAULT_OG_IMAGE),
        logo: absoluteUrl(origin, "/brand/logo.png"),
        description: brand.tagline,
        telephone: brand.phoneE164,
        email: brand.email,
        sameAs: [brand.facebookUrl, brand.youtubeUrl].filter(Boolean),
        address: {
          "@type": "PostalAddress",
          streetAddress: brand.addressLine,
          addressLocality: "Dhaka",
          addressRegion: "Dhaka",
          addressCountry: "BD",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 23.807,
          longitude: 90.368,
        },
        areaServed: { "@type": "Country", name: "Bangladesh" },
        priceRange: "৳৳",
        currenciesAccepted: "BDT",
        paymentAccepted: "Cash, bKash, Nagad, Card",
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: origin,
        name: brand.name,
        inLanguage: "en-BD",
        potentialAction: {
          "@type": "SearchAction",
          target: `${origin}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} storefront h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TrackingNoscript gtmId={seo.gtmId} />
        <TrackingScripts
          gtmId={seo.gtmId}
          ga4Id={seo.ga4Id}
          googleAdsId={seo.googleAdsId}
          facebookPixelId={seo.facebookPixelId}
          tiktokPixelId={seo.tiktokPixelId}
        />
        <JsonLd data={jsonLd} />
        <BrandProvider brand={brand}>
          <CartProvider>
            <LiveViewersProvider>
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
            </LiveViewersProvider>
          </CartProvider>
        </BrandProvider>
      </body>
    </html>
  );
}
