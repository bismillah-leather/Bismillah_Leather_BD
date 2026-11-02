import { getPrisma, Prisma } from "@bismillah/db";
import {
  isStorefrontImageSrc,
  POLICY_SLUGS,
  type PolicySlug,
  type StorefrontDraft,
} from "@bismillah/shared";
import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function PUT(request: Request) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const record = asRecord(body);
  if (!record) return NextResponse.json({ error: "Invalid content." }, { status: 400 });

  const heroInput = Array.isArray(record.hero) ? record.hero : [];
  const hero = heroInput
    .map((slide) => {
      const row = asRecord(slide);
      if (!row) return null;
      const src = text(row.src, 500);
      const alt = text(row.alt, 140);
      if (!isStorefrontImageSrc(src)) return null;
      return { src, alt: alt || "Hero" };
    })
    .filter((slide): slide is { src: string; alt: string } => Boolean(slide))
    .slice(0, 8);
  if (hero.length === 0) {
    return NextResponse.json({ error: "Add at least one hero image." }, { status: 400 });
  }

  const aboutRow = asRecord(record.about);
  const about = {
    eyebrow: text(aboutRow?.eyebrow, 80),
    title: text(aboutRow?.title, 160),
    body: text(aboutRow?.body, 8000),
    image: text(aboutRow?.image, 500),
  };
  if (!about.title || !about.body || !isStorefrontImageSrc(about.image)) {
    return NextResponse.json({ error: "About needs a title, story, and image." }, { status: 400 });
  }

  const trustInput = Array.isArray(record.trust) ? record.trust : [];
  const trust = [0, 1, 2, 3].map((index) => {
    const row = asRecord(trustInput[index]);
    return {
      title: text(row?.title, 80),
      text: text(row?.text, 180),
    };
  });
  if (trust.some((item) => !item.title || !item.text)) {
    return NextResponse.json({ error: "Each why-shop card needs a title and a line." }, { status: 400 });
  }

  const featuredInput = Array.isArray(record.featured) ? record.featured : [];
  const featured = featuredInput
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const slug = text(row.slug, 80).toLowerCase();
      const name = text(row.name, 80);
      const image = text(row.image, 500);
      if (!/^[a-z0-9-]{2,80}$/.test(slug) || !name || !isStorefrontImageSrc(image)) return null;
      return { slug, name, image };
    })
    .filter((item): item is { slug: string; name: string; image: string } => Boolean(item))
    .slice(0, 12);
  if (featured.length === 0) {
    return NextResponse.json({ error: "Add at least one featured category." }, { status: 400 });
  }

  const policyRow = asRecord(record.policies);
  const policies = {} as StorefrontDraft["policies"];
  for (const slug of POLICY_SLUGS) {
    const row = asRecord(policyRow?.[slug]);
    const title = text(row?.title, 120);
    const body = text(row?.body, 8000);
    if (!title || !body) {
      return NextResponse.json({ error: `Fill in the ${slug} page.` }, { status: 400 });
    }
    policies[slug] = { title, body };
  }

  const prisma = getPrisma();
  const blocks: { key: string; type: string; title: string; payload: Prisma.InputJsonValue }[] = [
    { key: "hero", type: "hero", title: "Hero", payload: { slides: hero } },
    { key: "about", type: "about", title: about.title, payload: about },
    { key: "trust", type: "trust", title: "Why shop", payload: { items: trust } },
    { key: "featured", type: "featured", title: "Featured categories", payload: { items: featured } },
  ];

  await prisma.$transaction(async (tx) => {
    for (const [index, block] of blocks.entries()) {
      await tx.homeSection.upsert({
        where: { key: block.key },
        create: {
          key: block.key,
          type: block.type,
          title: block.title,
          sortOrder: index,
          isActive: true,
          payload: block.payload,
        },
        update: {
          type: block.type,
          title: block.title,
          isActive: true,
          payload: block.payload,
        },
      });
    }
    for (const slug of POLICY_SLUGS) {
      const policy = policies[slug as PolicySlug];
      await tx.page.upsert({
        where: { slug },
        create: { slug, title: policy.title, body: policy.body, isPublished: true },
        update: { title: policy.title, body: policy.body, isPublished: true },
      });
    }
    await tx.auditLog.create({
      data: {
        actorId: admin.sub,
        action: "storefront.update",
        entityType: "HomeSection",
        entityId: "storefront",
        after: { hero: hero.length, featured: featured.length },
      },
    });
  });

  return NextResponse.json({ ok: true });
}
