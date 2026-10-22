import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/");

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="font-display text-3xl">Bismillah</p>
        <p className="mt-1 text-xs tracking-[0.18em] text-muted-foreground uppercase">
          Admin sign in
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Staff access only. Failed attempts are rate-limited and logged.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
