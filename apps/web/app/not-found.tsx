import { Button } from "@bismillah/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <p className="text-xs tracking-[0.18em] text-primary uppercase">404</p>
      <h1 className="font-display mt-3 text-4xl">This page is not in the catalog.</h1>
      <Button asChild className="mt-8">
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
