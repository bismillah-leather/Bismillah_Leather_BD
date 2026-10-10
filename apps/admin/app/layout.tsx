import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Admin · Bismillah Leather",
  robots: { index: false, follow: false },
};

const NAV = [
  "Dashboard",
  "Products",
  "Orders",
  "Inventory",
  "Customers",
  "Coupons",
  "Content",
  "Settings",
] as const;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="mx-auto grid min-h-full max-w-6xl md:grid-cols-[220px_1fr]">
          <aside className="border-b border-border px-4 py-5 md:border-r md:border-b-0">
            <p className="font-display text-xl">Bismillah</p>
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Admin</p>
            <nav className="mt-6 flex gap-2 overflow-x-auto md:grid">
              {NAV.map((item) => (
                <span
                  key={item}
                  className="inline-flex h-11 shrink-0 items-center rounded-md px-3 text-sm text-muted-foreground md:px-2"
                >
                  {item}
                </span>
              ))}
            </nav>
          </aside>
          <div className="px-4 py-6 sm:px-6">{children}</div>
        </div>
      </body>
    </html>
  );
}
