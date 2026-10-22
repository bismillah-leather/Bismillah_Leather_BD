import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  return (
    <AdminShell userName={session.name} userRole={session.role}>
      {children}
    </AdminShell>
  );
}
