import { formatPaisa, type ShowcaseProduct } from "@bismillah/shared";
import Link from "next/link";
import { ProductPhoto } from "./leather-visual";

export function ProductCard({ product }: { product: ShowcaseProduct }) {
  const price = product.salePaisa ?? product.pricePaisa;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative overflow-hidden bg-[#efeae3]">
        <ProductPhoto src={product.image} alt={product.name} />
        {product.inStock ? null : (
          <span className="absolute top-3 right-3 bg-foreground px-2.5 py-1 text-[11px] tracking-wide text-background uppercase">
            Sold out
          </span>
        )}
        {product.salePaisa ? (
          <span className="absolute top-3 left-3 bg-accent px-2.5 py-1 text-[11px] tracking-wide text-accent-foreground uppercase">
            Sale
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 text-sm leading-5 tracking-wide text-foreground group-hover:underline">
        {product.name}
      </h3>
      <p className="mt-1 text-sm">
        <span>{formatPaisa(price)}</span>
        {product.salePaisa ? (
          <span className="ml-2 text-muted-foreground line-through">{formatPaisa(product.pricePaisa)}</span>
        ) : null}
      </p>
    </Link>
  );
}
