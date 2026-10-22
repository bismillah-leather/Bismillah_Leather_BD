import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminAuthShell } from "@/components/admin-auth-shell";
import { getAdminSession } from "@/lib/session";
import { LoginForm } from "./login/login-form";

/** /admin — login for guests, dashboard for signed-in staff. */
export default async function AdminRootPage() {
  const session = await getAdminSession();
  if (session) redirect("/dashboard");

  return (
    <AdminAuthShell
      eyebrow="Staff sign in"
      formTitle="Welcome back"
      lead="Use your staff email and password to open the console."
      panelTitle="Quiet tools for loud leather demand."
      panelSubtitle="Confirm orders, run flash sales, and keep Mirpur-10 packing on schedule."
      footer={
        <p className="text-center">
          Need a staff account?{" "}
          <Link
            href="/register"
            className="text-foreground underline decoration-primary/50 underline-offset-4 transition hover:decoration-primary"
          >
            Register with master key
          </Link>
        </p>
      }
    >
      <LoginForm defaultEmail={process.env.SEED_ADMIN_EMAIL?.trim() || ""} />
    </AdminAuthShell>
  );
}
