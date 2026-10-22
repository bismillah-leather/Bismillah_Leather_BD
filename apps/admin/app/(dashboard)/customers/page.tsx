import { getPrisma } from "@bismillah/db";
import { formatPaisa } from "@bismillah/shared";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminSearch } from "@/components/admin-search";
import { ToggleButton } from "@/components/toggle-button";
import { requireAdmin } from "@/lib/admin-auth";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const prisma = getPrisma();

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      isBlocked: true,
      orderCount: true,
      totalSpent: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="CRM"
        title="Customers"
        description="Buyer accounts by mobile. Block risky numbers to stop new sessions."
      />

      <div className="mt-6">
        <Suspense fallback={null}>
          <AdminSearch placeholder="Search name, phone, email…" />
        </Suspense>
      </div>

      <ul className="admin-panel mt-8 divide-y divide-border">
        {customers.length === 0 ? (
          <li className="px-4 py-10 text-sm text-muted-foreground">No customers found.</li>
        ) : (
          customers.map((c) => (
            <li
              key={c.id}
              className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {c.phone}
                  {c.email ? ` · ${c.email}` : ""} · {c.orderCount} orders ·{" "}
                  {formatPaisa(c.totalSpent)} · joined {c.createdAt.toLocaleDateString()}
                </p>
              </div>
              <ToggleButton
                endpoint={`/admin/api/customers/${c.id}/block`}
                flagKey="isBlocked"
                active={c.isBlocked}
                activeLabel="Blocked"
                inactiveLabel="Active"
              />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
