import { getPrisma } from "@bismillah/db";
import { requireAdmin, isMasterKeyConfigured } from "@/lib/admin-auth";
import { RegisterForm } from "@/app/register/register-form";

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
      <h1 className="font-display text-4xl">Team</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Admin accounts for the console. Public register is at{" "}
        <code className="text-foreground">/admin/register</code> with master key; owners can
        invite here without the key.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Accounts
        </h2>
        <ul className="mt-3 divide-y divide-border border border-border bg-card">
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
        <section className="mt-10 max-w-md border border-border bg-card p-6">
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
