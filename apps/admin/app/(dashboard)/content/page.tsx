import { getPrisma } from "@bismillah/db";
import { AdminPageHeader } from "@/components/admin-page-header";
import { ToggleButton } from "@/components/toggle-button";
import { requireAdmin } from "@/lib/admin-auth";
import { PageCreateForm } from "./page-create-form";

export default async function ContentPage() {
  await requireAdmin();
  const prisma = getPrisma();

  const [pages, sections] = await Promise.all([
    prisma.page.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        slug: true,
        title: true,
        isPublished: true,
        updatedAt: true,
      },
    }),
    prisma.homeSection.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        key: true,
        type: true,
        title: true,
        isActive: true,
        sortOrder: true,
      },
    }),
  ]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Storefront"
        title="Content"
        description="Static pages and home sections that shape the leather storefront story."
      />

      <section className="mt-8 max-w-2xl">
        <h2 className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          New page
        </h2>
        <div className="mt-3">
          <PageCreateForm />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Pages
        </h2>
        <ul className="admin-panel mt-3 divide-y divide-border">
          {pages.length === 0 ? (
            <li className="px-4 py-8 text-sm text-muted-foreground">No pages yet.</li>
          ) : (
            pages.map((p) => (
              <li
                key={p.id}
                className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    /{p.slug} · updated {p.updatedAt.toLocaleDateString()}
                  </p>
                </div>
                <ToggleButton
                  endpoint={`/admin/api/content/pages/${p.id}`}
                  flagKey="isPublished"
                  active={p.isPublished}
                  activeLabel="Published"
                  inactiveLabel="Draft"
                />
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Home sections
        </h2>
        <ul className="admin-panel mt-3 divide-y divide-border">
          {sections.length === 0 ? (
            <li className="px-4 py-8 text-sm text-muted-foreground">
              No home sections seeded yet.
            </li>
          ) : (
            sections.map((s) => (
              <li
                key={s.id}
                className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <p className="text-sm font-medium">{s.title || s.key}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.key} · {s.type} · sort {s.sortOrder}
                  </p>
                </div>
                <ToggleButton
                  endpoint={`/admin/api/content/sections/${s.id}`}
                  flagKey="isActive"
                  active={s.isActive}
                  activeLabel="On"
                  inactiveLabel="Off"
                />
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
