import type { ShowcaseProduct } from "@bismillah/shared";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: readonly ShowcaseProduct[] }) {
  if (products.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-5 py-16 text-center text-muted-foreground">
        Nothing in this view yet.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-12 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14">
      {products.map((product) => (
        <li key={product.slug}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
