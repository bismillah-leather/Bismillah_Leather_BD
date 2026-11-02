import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";

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
    return (
      <AdminShell userName={session.name} userRole={session.role}>
        {children}
      </AdminShell>
    );
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.error("[admin] dashboard layout failed:", error);
    return (
      <main className="grid min-h-dvh place-items-center bg-[#0e0c0a] px-6 text-[#f6efe4]">
        <div className="max-w-md text-center">
          <p className="text-[11px] tracking-[0.18em] text-[#e4c98a] uppercase">Database</p>
          <h1 className="font-display mt-3 text-3xl tracking-tight">Connection dropped</h1>
          <p className="mt-3 text-sm leading-6 text-[#cbbfae]">
            The admin could not reach the database. Refresh the page in a moment.
          </p>
        </div>
      </main>
    );
  }
}
