import type { ReactNode } from "react";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { requestStoreOrigin } from "@/lib/media-url";
import DashboardLoading from "./loading";

function isRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  try {
    const session = await requireAdmin();
    const storeHref = await requestStoreOrigin();
    return (
      <AdminShell userName={session.name} userRole={session.role} storeHref={storeHref}>
        <Suspense fallback={<DashboardLoading />}>{children}</Suspense>
      </AdminShell>
    );
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.error("[admin] dashboard layout failed:", error);
    return (
      <main className="grid min-h-dvh place-items-center bg-white px-6 text-black">
        <div className="max-w-md text-center">
          <p className="text-[11px] tracking-[0.18em] text-neutral-500 uppercase">Database</p>
          <h1 className="font-display mt-3 text-3xl tracking-tight">Connection dropped</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            The admin could not reach the database. Refresh the page in a moment.
          </p>
        </div>
      </main>
    );
  }
}
