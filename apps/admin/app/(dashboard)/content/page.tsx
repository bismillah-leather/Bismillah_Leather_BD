import { getPrisma } from "@bismillah/db";
import { POLICY_SLUGS, readStorefrontDraft } from "@bismillah/shared";
import { AdminPageHeader } from "@/components/admin-page-header";
import { requireAdmin } from "@/lib/admin-auth";
import { PageRow, SectionCreateForm, SectionRow } from "./content-rows";
import { PageCreateForm } from "./page-create-form";
import { StorefrontStudio } from "./storefront-studio";

export default async function ContentPage() {
  const prisma = getPrisma();
  const [, pages, sections, policyPages] = await Promise.all([
    requireAdmin(),
    prisma.page.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        slug: true,
        title: true,
        body: true,
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
        payload: true,
      },
    }),
    prisma.page.findMany({
      where: { slug: { in: [...POLICY_SLUGS] } },
      select: { slug: true, title: true, body: true },
    }),
  ]);
  const studioSections = sections.filter((section) =>
    ["hero", "about", "trust", "featured"].includes(section.key),
  );
  const draft = readStorefrontDraft({ sections: studioSections, pages: policyPages });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Storefront"
        title="Content"
        description="Change the hero, featured photos, about page, and the policy pages the customer sees."
      />

      <StorefrontStudio initial={draft} />

      <section className="mt-12 max-w-2xl">
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
              <PageRow
                key={p.id}
                id={p.id}
                title={p.title}
                body={p.body}
                isPublished={p.isPublished}
                meta={`/${p.slug} · updated ${p.updatedAt.toLocaleDateString()}`}
              />
            ))
          )}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Home sections
        </h2>
        <SectionCreateForm />
        <ul className="admin-panel mt-3 divide-y divide-border">
          {sections.length === 0 ? (
            <li className="px-4 py-8 text-sm text-muted-foreground">
              No home sections seeded yet.
            </li>
          ) : (
            sections.map((s) => (
              <SectionRow
                key={s.id}
                id={s.id}
                title={s.title || s.key}
                isActive={s.isActive}
                meta={`${s.key} · ${s.type} · sort ${s.sortOrder}`}
              />
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
