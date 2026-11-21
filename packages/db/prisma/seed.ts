import "dotenv/config";
import { hash } from "@node-rs/argon2";
import {
  BRAND,
  INITIAL_CATEGORIES,
  INITIAL_MATERIALS,
  SHOWCASE_PRODUCTS,
} from "@bismillah/shared";
import { getPrisma } from "../src/client";

const prisma = getPrisma();

async function seedCategories() {
  for (const category of INITIAL_CATEGORIES) {
    await prisma.category.upsert({
      where: { path: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        path: category.slug,
        sortOrder: category.sortOrder,
        isActive: true,
        seoTitle: category.name,
        seoDescription: category.blurb,
      },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
      },
    });
  }
}

async function seedMaterials() {
  const attribute = await prisma.attribute.upsert({
    where: { slug: "material" },
    create: { name: "Material", slug: "material", sortOrder: 0 },
    update: { name: "Material" },
  });

  for (const [index, material] of INITIAL_MATERIALS.entries()) {
    await prisma.attributeValue.upsert({
      where: {
        attributeId_slug: { attributeId: attribute.id, slug: material.slug },
      },
      create: {
        attributeId: attribute.id,
        value: material.name,
        slug: material.slug,
        sortOrder: index,
      },
      update: { value: material.name, sortOrder: index },
    });
  }
}

async function seedDelivery() {
  const rules = [
    {
      name: "Inside Dhaka",
      kind: "inside_dhaka" as const,
      district: null,
      fee: 8000n,
      sortOrder: 10,
    },
    {
      name: "Outside Dhaka",
      kind: "outside_dhaka" as const,
      district: null,
      fee: 13000n,
      sortOrder: 20,
    },
  ];

  for (const rule of rules) {
    await prisma.deliveryRule.upsert({
      where: { name: rule.name },
      create: rule,
      update: { fee: rule.fee, sortOrder: rule.sortOrder, kind: rule.kind },
    });
  }
}

async function seedSettings() {
  const settings = [
    { key: "store", value: { name: "Bismillah Leather", currency: "BDT", timezone: "Asia/Dhaka" } },
    { key: "live_viewers", value: { enabled: true, minToShow: 2 } },
    { key: "payments", value: { cod: true, online: false } },
    { key: "store.name", value: BRAND.name },
    { key: "store.supportPhone", value: BRAND.phoneDisplay },
    { key: "store.supportWhatsapp", value: "8801957876157" },
    { key: "store.email", value: BRAND.email },
    { key: "store.facebookUrl", value: BRAND.facebookUrl },
    { key: "store.youtubeUrl", value: BRAND.youtubeUrl },
    { key: "store.address", value: BRAND.addressLine },
    { key: "store.addressShort", value: BRAND.addressShort },
    {
      key: "store.codNote",
      value: "Cash on delivery available in Dhaka. We call before packing.",
    },
    {
      key: "store.shippingNote",
      value: "Dhaka delivery 1–2 days. Outside Dhaka 2–4 days after confirmation.",
    },
    { key: "store.announcement", value: "" },
    {
      key: "seo.tracking",
      value: {
        gtmId: "GTM-WBHX3XS6",
        ga4Id: "",
        googleAdsId: "",
        googleSiteVerification: "",
        bingSiteVerification: "",
        facebookPixelId: "",
        tiktokPixelId: "",
        seoTitle: "",
        seoDescription: "",
        seoKeywords: "",
      },
    },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      create: setting,
      update: {},
    });
  }
}

async function seedProducts() {
  for (const item of SHOWCASE_PRODUCTS) {
    const category = await prisma.category.findFirst({
      where: { slug: item.categorySlug, deletedAt: null },
      select: { id: true },
    });
    if (!category) continue;

    const existing = await prisma.product.findUnique({
      where: { slug: item.slug },
      select: { id: true },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          description: item.blurb,
          status: "published",
          publishedAt: new Date(),
          deletedAt: null,
          ogImageKey: item.image,
          primaryCategoryId: category.id,
        },
      });
      const variant = await prisma.productVariant.findFirst({
        where: { productId: existing.id },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (variant) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            sku: item.sku,
            price: item.pricePaisa,
            salePrice: item.salePaisa,
            stockOnHand: item.inStock ? 25 : 0,
            isActive: true,
          },
        });
      }
      continue;
    }

    await prisma.product.create({
      data: {
        name: item.name,
        slug: item.slug,
        description: item.blurb,
        status: "published",
        publishedAt: new Date(),
        primaryCategoryId: category.id,
        ogImageKey: item.image,
        isFeatured: Boolean(item.salePaisa),
        categories: { create: [{ categoryId: category.id }] },
        variants: {
          create: {
            sku: item.sku,
            price: item.pricePaisa,
            salePrice: item.salePaisa,
            stockOnHand: item.inStock ? 25 : 0,
            isActive: true,
          },
        },
        media: {
          create: {
            type: "image",
            storageKey: item.image,
            sortOrder: 0,
            alt: item.name,
            processingStatus: "ready",
          },
        },
      },
    });
  }
}

async function seedTemplates() {
  const templates = [
    {
      key: "order_placed",
      channel: "sms" as const,
      body: "Bismillah Leather: order {{number}} is placed. Total {{total}}. We will call to confirm.",
    },
    {
      key: "order_shipped",
      channel: "sms" as const,
      body: "Bismillah Leather: order {{number}} is on the way. Tracking {{tracking}}.",
    },
    {
      key: "order_delivered",
      channel: "sms" as const,
      body: "Bismillah Leather: order {{number}} was delivered. Thank you.",
    },
  ];

  for (const template of templates) {
    await prisma.notificationTemplate.upsert({
      where: { key_channel: { key: template.key, channel: template.channel } },
      create: template,
      update: {},
    });
  }
}

async function seedOwner() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "owner@bismillah.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "dev-only-change-me";

  // @node-rs/argon2 defaults to Argon2id.
  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  // Keep owner in sync with .env so SEED_ADMIN_* always logs in after seed.
  await prisma.adminUser.upsert({
    where: { email },
    create: {
      email,
      name: "Owner",
      passwordHash,
      role: "owner",
      isActive: true,
    },
    update: {
      passwordHash,
      isActive: true,
      role: "owner",
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });
}

async function main() {
  await seedCategories();
  await seedMaterials();
  await seedDelivery();
  await seedSettings();
  await seedProducts();
  await seedTemplates();
  await seedOwner();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
