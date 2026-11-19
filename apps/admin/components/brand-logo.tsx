import { BRAND } from "@bismillah/shared";

export function BrandLogo({
  size = 36,
  className = "",
  alt = BRAND.name,
  onDark = false,
}: {
  size?: number;
  className?: string;
  alt?: string;
  onDark?: boolean;
}) {
  const src = `/admin${onDark ? BRAND.logoLightSrc : BRAND.logoSrc}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`inline-block shrink-0 object-contain object-center ${className}`}
    />
  );
}
