import { getPrisma } from "@bismillah/db";
import { Card, CardDescription, CardHeader, CardTitle } from "@bismillah/ui";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listSecurityAlerts } from "@/lib/security-alerts";

export default async function AdminHomePage() {
  const session = await requireAdmin();
  const prisma = getPrisma();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [ordersToday, pending, lowStock, alerts, lockedAdmins] = await Promise.all([
    prisma.order.count({ where: { placedAt: { gte: startOfDay } } }),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.productVariant.count({
      where: { stockOnHand: { lte: 3 }, isActive: true },
    }),
    listSecurityAlerts(5),
    prisma.adminUser.count({
      where: { lockedUntil: { gt: new Date() } },
    }),
  ]);

  const tiles = [
    { title: "Orders today", detail: String(ordersToday) },
    { title: "Pending confirmation", detail: String(pending) },
    { title: "Low stock variants", detail: String(lowStock) },
    {
      title: "Security",
      detail:
        lockedAdmins > 0
          ? `${lockedAdmins} locked account(s)`
          : alerts[0]
            ? alerts[0].detail
            : "No recent alerts",
    },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl">Dashboard</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Welcome back, {session.name}. Live store metrics and security signals.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {tiles.map((tile) => (
          <li key={tile.title}>
            <Card>
              <CardHeader>
                <CardTitle>{tile.title}</CardTitle>
                <CardDescription className="line-clamp-2">{tile.detail}</CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm">
        <Link href="/security" className="underline underline-offset-2">
          Open security & rate alerts →
        </Link>
      </p>
    </div>
  );
}
