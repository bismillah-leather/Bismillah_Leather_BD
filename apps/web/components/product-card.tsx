import { formatPaisa, type ShowcaseProduct } from "@bismillah/shared";
import Link from "next/link";
import { ProductPhoto } from "./leather-visual";

export function ProductCard({ product }: { product: ShowcaseProduct }) {
  const price = product.salePaisa ?? product.pricePaisa;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative overflow-hidden bg-secondary">
        <ProductPhoto src={product.image} alt={product.name} />
        {product.inStock ? null : (
          <span className="absolute top-2 right-2 bg-foreground px-2 py-0.5 text-[10px] tracking-wide text-background uppercase sm:top-3 sm:right-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
            Sold out
          </span>
        )}
        {product.salePaisa ? (
          <span className="absolute top-2 left-2 bg-accent px-2 py-0.5 text-[10px] tracking-wide text-accent-foreground uppercase sm:top-3 sm:left-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
            Sale
          </span>
        ) : null}
      </div>
      <h3 className="mt-2 text-[13px] leading-snug tracking-wide text-foreground group-hover:underline sm:mt-3 sm:text-sm sm:leading-5">
        {product.name}
      </h3>
      <p className="mt-1 text-[13px] sm:text-sm">
        <span>{formatPaisa(price)}</span>
        {product.salePaisa ? (
          <span className="ml-1.5 text-muted-foreground line-through sm:ml-2">
            {formatPaisa(product.pricePaisa)}
          </span>
        ) : null}
      </p>
    </Link>
  );
}
