import { getPrisma } from "@bismillah/db";
import Link from "next/link";
import { RegisterForm } from "@/app/register/register-form";
import { AdminPageHeader } from "@/components/admin-page-header";
import { isMasterKeyConfigured, requireAdmin } from "@/lib/admin-auth";
import { TeamRowActions } from "./team-row-actions";

export default async function TeamPage() {
  const prisma = getPrisma();
  const [session, staff] = await Promise.all([
    requireAdmin(),
    prisma.adminUser.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lockedUntil: true,
      failedLoginCount: true,
      lastLoginAt: true,
      createdAt: true,
    },
    }),
  ]);

  const canInvite = session.role === "owner" || session.role === "manager";
  const now = new Date();
  const activeCount = staff.filter((u) => u.isActive).length;
  const lockedCount = staff.filter((u) => u.lockedUntil && u.lockedUntil > now).length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Access"
        title="Team"
        description="Invite staff, reset passwords, activate or unlock accounts. Change your own password under Account."
      />

      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        <li className="admin-metric">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Staff</p>
          <p className="font-display mt-1.5 text-2xl text-primary">{staff.length}</p>
        </li>
        <li className="admin-metric">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Active</p>
          <p className="font-display mt-1.5 text-2xl">{activeCount}</p>
        </li>
        <li className="admin-metric">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Locked</p>
          <p className="font-display mt-1.5 text-2xl">{lockedCount}</p>
        </li>
      </ul>

      <section className="mt-8">
        <h2 className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Accounts
        </h2>
        <ul className="admin-panel mt-3 divide-y divide-border">
          {staff.map((u) => {
            const locked = Boolean(u.lockedUntil && u.lockedUntil > now);
            const isSelf = u.id === session.sub;
            return (
              <li
                key={u.id}
                className="grid gap-3 px-4 py-4 lg:grid-cols-[1.4fr_auto] lg:items-center"
              >
                <div>
                  <p className="font-medium">
                    {u.name}
                    {isSelf ? (
                      <span className="ml-2 text-[10px] tracking-wide text-primary uppercase">
                        You
                      </span>
                    ) : null}{" "}
                    <span className="text-xs font-normal tracking-wide text-muted-foreground uppercase">
                      · {u.role}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {u.email}
                    {" · "}
                    {u.isActive ? "Active" : "Inactive"}
                    {locked ? " · Locked" : ""}
                    {u.failedLoginCount > 0 ? ` · fails ${u.failedLoginCount}` : ""}
                    {u.lastLoginAt
                      ? ` · last ${u.lastLoginAt.toLocaleDateString()}`
                      : " · never signed in"}
                  </p>
                </div>
                {isSelf ? (
                  <p className="text-xs text-muted-foreground lg:text-right">
                    Manage under{" "}
                    <Link href="/account" className="text-primary hover:underline">
                      Account
                    </Link>
                  </p>
                ) : (
                  <TeamRowActions
                    userId={u.id}
                    userName={u.name}
                    role={u.role}
                    isActive={u.isActive}
                    isLocked={locked}
                    viewerRole={session.role}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {canInvite ? (
        <section className="admin-panel mt-10 max-w-md p-6">
          <h2 className="font-display text-2xl tracking-tight">Invite staff</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Creates a new admin. They sign in with email + password — no master key needed from
            here.
          </p>
          <div className="mt-6">
            <RegisterForm masterReady={isMasterKeyConfigured()} requireMasterKey={false} />
          </div>
        </section>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          Only owners and managers can invite from here. Use master key on{" "}
          <code className="text-foreground">/admin/register</code>.
        </p>
      )}
    </div>
  );
}
