import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { INITIAL_CATEGORIES, INITIAL_MATERIALS } from "@bismillah/shared";
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
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      create: setting,
      update: {},
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
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) return;

  // @node-rs/argon2 defaults to Argon2id.
  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  await prisma.adminUser.create({
    data: {
      email,
      name: "Owner",
      passwordHash,
      role: "owner",
      isActive: true,
    },
  });
}

async function main() {
  await seedCategories();
  await seedMaterials();
  await seedDelivery();
  await seedSettings();
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
