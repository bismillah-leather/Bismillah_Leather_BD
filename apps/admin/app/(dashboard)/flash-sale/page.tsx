import { readFlashSaleForAdmin } from "@bismillah/db";
import { requireAdmin } from "@/lib/admin-auth";
import { loadCatalogPicker } from "@/lib/catalog-picker";
import { requestStoreOrigin } from "@/lib/media-url";
import { FlashSaleAdminPage } from "./flash-sale-form";

export default async function FlashSalePage() {
  const origin = await requestStoreOrigin();
  const [, sale, catalog] = await Promise.all([
    requireAdmin(),
    readFlashSaleForAdmin(),
    loadCatalogPicker(origin),
  ]);
  return (
    <FlashSaleAdminPage
      initialSale={sale}
      initialCatalog={catalog.map((product) => ({
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        pricePaisa: product.pricePaisa,
      }))}
    />
  );
}
