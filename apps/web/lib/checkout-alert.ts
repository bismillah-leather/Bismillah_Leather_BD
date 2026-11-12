import { getPrisma } from "@bismillah/db";

type AlertKind = "checkout_rate_limit" | "fake_order";

export async function pushCheckoutAlert(kind: AlertKind, ip: string, detail: string) {
  try {
    const prisma = getPrisma();
    const row = await prisma.setting.findUnique({ where: { key: "security.alerts" } });
    const prev = Array.isArray(row?.value) ? row.value : [];
    const next = [
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        kind,
        ip,
        detail: detail.slice(0, 180),
      },
      ...prev,
    ].slice(0, 50);
    await prisma.setting.upsert({
      where: { key: "security.alerts" },
      create: { key: "security.alerts", value: next },
      update: { value: next },
    });
  } catch (error) {
    console.error("[web] security alert failed:", error);
  }
}
