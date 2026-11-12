import { Suspense } from "react";
import { FlashSaleSection } from "@/components/flash-sale-section";
import { listPublishedProducts } from "@/lib/catalog";
import { readFlashSale } from "@/lib/flash-sale-store";

async function HomeFlashSaleInner() {
  const [sale, catalog] = await Promise.all([readFlashSale(), listPublishedProducts()]);
  return <FlashSaleSection sale={sale} catalog={catalog} />;
}

function FlashSaleFallback() {
  return (
    <section
      id="flash-sale"
      aria-hidden
      className="min-h-[22rem] bg-black sm:min-h-[28rem]"
    />
  );
}

/** Streams flash-sale IO so `/` can still prerender a static shell. */
export function HomeFlashSale() {
  return (
    <Suspense fallback={<FlashSaleFallback />}>
      <HomeFlashSaleInner />
    </Suspense>
  );
}
