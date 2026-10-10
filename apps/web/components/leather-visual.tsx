import Image from "next/image";

export function ProductPhoto({
  src,
  alt,
  priority = false,
  sizes = "(min-width: 1024px) 25vw, 50vw",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover transition duration-700 ease-out group-hover:scale-[1.045]"
      />
    </div>
  );
}
