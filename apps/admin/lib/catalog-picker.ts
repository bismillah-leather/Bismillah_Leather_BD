import { getPrisma } from "@bismillah/db";
import { adminMediaSrc } from "./media-url";
import { remember } from "./ttl-cache";

export type CatalogPickerItem = {
  id: string;
  name: string;
  slug: string;
  status: string;
  sku: string;
  pricePaisa: string;
  image: string;
};

export function loadCatalogPicker(origin: string) {
  return remember(`catalog-picker:${origin}`, 12_000, async () => {
    const products = await getPrisma().product.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      take: 200,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        ogImageKey: true,
        variants: {
          where: { isActive: true },
          take: 1,
          select: { sku: true, price: true },
        },
      },
    });
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      status: product.status,
      sku: product.variants[0]?.sku ?? "",
      pricePaisa: (product.variants[0]?.price ?? 0n).toString(),
      image: adminMediaSrc(product.ogImageKey, origin) ?? "",
    })) satisfies CatalogPickerItem[];
  });
}
