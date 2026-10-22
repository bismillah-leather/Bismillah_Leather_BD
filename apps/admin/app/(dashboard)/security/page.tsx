import { getPrisma } from "@bismillah/db";
import { AdminPageHeader } from "@/components/admin-page-header";
import { requireAdmin } from "@/lib/admin-auth";
import { listSecurityAlerts } from "@/lib/security-alerts";

export default async function SecurityPage() {
  await requireAdmin();
  const prisma = getPrisma();

  const [alerts, locked, recentFails] = await Promise.all([
    listSecurityAlerts(40),
    prisma.adminUser.findMany({
      where: { lockedUntil: { gt: new Date() } },
      select: { email: true, lockedUntil: true, failedLoginCount: true },
    }),
    prisma.auditLog.findMany({
      where: { action: "admin.login_fail" },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { createdAt: true, ip: true, after: true, entityId: true },
    }),
  ]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Protection"
        title="Security"
        description="Rate-limit hits, lockouts, and failed admin sign-ins. Login capped at 10 / 15 min per IP; lock after 5 bad passwords."
      />

      <section className="mt-8">
        <h2 className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Locked accounts
        </h2>
        {locked.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">None right now.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {locked.map((u) => (
              <li key={u.email} className="admin-metric">
                <p className="text-sm font-medium">{u.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Locked until {u.lockedUntil?.toLocaleString()} · fails {u.failedLoginCount}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Rate & alert feed
        </h2>
        {alerts.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No alerts yet.</p>
        ) : (
          <ul className="admin-panel mt-3 divide-y divide-border">
            {alerts.map((a) => (
              <li key={a.id} className="px-4 py-3.5 text-sm">
                <p className="font-medium">{a.detail}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {a.kind}
                  {a.ip ? ` · ${a.ip}` : ""} · {new Date(a.at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Recent failed logins
        </h2>
        {recentFails.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Clean slate.</p>
        ) : (
          <ul className="admin-panel mt-3 divide-y divide-border">
            {recentFails.map((f, i) => (
              <li key={`${f.createdAt.toISOString()}-${i}`} className="px-4 py-3.5 text-sm">
                <p className="font-medium">Login failed</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {f.ip ?? "no-ip"} · {f.createdAt.toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
