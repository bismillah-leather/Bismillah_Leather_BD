import { getPrisma } from "@bismillah/db";
import { Card, CardDescription, CardHeader, CardTitle } from "@bismillah/ui";
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
      <h1 className="font-display text-4xl">Security</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Rate-limit hits, lockouts, and failed admin sign-ins. Login is capped at 10
        attempts / 15 min per IP; accounts lock after 5 bad passwords.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Locked accounts
        </h2>
        {locked.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">None right now.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {locked.map((u) => (
              <li key={u.email}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{u.email}</CardTitle>
                    <CardDescription>
                      Locked until {u.lockedUntil?.toLocaleString()} · fails{" "}
                      {u.failedLoginCount}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Rate & alert feed
        </h2>
        {alerts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No alerts yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {alerts.map((a) => (
              <li key={a.id} className="py-3 text-sm">
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
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Recent failed logins
        </h2>
        {recentFails.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Clean slate.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {recentFails.map((f, i) => (
              <li key={`${f.createdAt.toISOString()}-${i}`} className="py-3 text-sm">
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
