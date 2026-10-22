import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-page-header";
import { requireAdmin } from "@/lib/admin-auth";
import { PasswordForm, ProfileForm } from "./account-forms";

export default async function AccountPage() {
  const session = await requireAdmin();

  return (
    <div>
      <AdminPageHeader
        eyebrow="You"
        title="Account"
        description="Update your display name and password. Team invites and staff resets live under Team."
      />

      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        <li className="admin-metric">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Email</p>
          <p className="mt-1.5 truncate text-sm">{session.email}</p>
        </li>
        <li className="admin-metric">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Role</p>
          <p className="font-display mt-1.5 text-xl capitalize text-primary">{session.role}</p>
        </li>
        <li className="admin-metric">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Shortcuts</p>
          <p className="mt-2 flex flex-wrap gap-2 text-xs">
            <Link href="/team" className="text-primary hover:underline">
              Team
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/settings" className="text-primary hover:underline">
              Settings
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/security" className="text-primary hover:underline">
              Security
            </Link>
          </p>
        </li>
      </ul>

      <div className="mt-8 grid max-w-xl gap-6">
        <ProfileForm initialName={session.name} />
        <PasswordForm />
      </div>
    </div>
  );
}
