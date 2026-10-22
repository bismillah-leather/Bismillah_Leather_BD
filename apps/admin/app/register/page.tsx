import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminAuthShell } from "@/components/admin-auth-shell";
import { isMasterKeyConfigured } from "@/lib/admin-auth";
import { getAdminSession } from "@/lib/session";
import { RegisterForm } from "./register-form";

export default async function AdminRegisterPage() {
  const session = await getAdminSession();
  if (session) redirect("/team");

  const masterReady = isMasterKeyConfigured();

  return (
    <AdminAuthShell
      eyebrow="Staff registration"
      formTitle="Create staff account"
      lead="Master key required. Owner stays seed-only — invite manager, staff, or support."
      panelTitle="Invite the team that packs the leather."
      panelSubtitle="One master key. New accounts sign in with email and password only."
      panelNote={
        masterReady
          ? "Master key configured on this server"
          : "Set ADMIN_MASTER_KEY in env before inviting"
      }
      footer={
        <p className="text-center">
          Already have access?{" "}
          <Link
            href="/"
            className="text-foreground underline decoration-primary/50 underline-offset-4 transition hover:decoration-primary"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterForm masterReady={masterReady} />
    </AdminAuthShell>
  );
}
