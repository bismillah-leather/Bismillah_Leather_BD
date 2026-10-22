import { getPrisma } from "@bismillah/db";
import { RegisterForm } from "@/app/register/register-form";
import { AdminPageHeader } from "@/components/admin-page-header";
import { isMasterKeyConfigured, requireAdmin } from "@/lib/admin-auth";

export default async function TeamPage() {
  const session = await requireAdmin();
  const prisma = getPrisma();
  const canInvite = session.role === "owner" || session.role === "manager";

  const staff = await prisma.adminUser.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Access"
        title="Team"
        description="Staff accounts for this console. Public register needs the master key; owners can invite here without it."
      />

      <section className="mt-8">
        <h2 className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Accounts
        </h2>
        <ul className="admin-panel mt-3 divide-y divide-border">
          {staff.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3.5"
            >
              <div>
                <p className="font-medium">
                  {u.name}{" "}
                  <span className="text-xs font-normal tracking-wide text-muted-foreground uppercase">
                    · {u.role}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {u.isActive ? "Active" : "Inactive"}
                {u.lastLoginAt
                  ? ` · last ${u.lastLoginAt.toLocaleDateString()}`
                  : " · never signed in"}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {canInvite ? (
        <section className="admin-panel mt-10 max-w-md p-6">
          <h2 className="font-display text-2xl tracking-tight">Invite staff</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Creates a new admin. They sign in with email + password.
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
