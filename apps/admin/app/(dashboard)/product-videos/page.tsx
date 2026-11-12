import { readStoredProductVideos } from "@bismillah/db";
import { requireAdmin } from "@/lib/admin-auth";
import { loadCatalogPicker } from "@/lib/catalog-picker";
import { requestStoreOrigin } from "@/lib/media-url";
import { ProductVideosPage } from "./product-videos-form";

export default async function ProductVideosRoute() {
  const origin = await requestStoreOrigin();
  const [, videos, catalog] = await Promise.all([
    requireAdmin(),
    readStoredProductVideos(),
    loadCatalogPicker(origin),
  ]);
  return (
    <ProductVideosPage
      initialMap={videos ?? {}}
      initialCatalog={catalog.map((product) => ({
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        image: product.image,
      }))}
    />
  );
}
