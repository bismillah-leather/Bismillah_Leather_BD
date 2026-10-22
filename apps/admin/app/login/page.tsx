import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/");

  return (
    <div className="relative flex min-h-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #000 0.55px, transparent 0.65px), radial-gradient(circle at 80% 70%, #000 0.45px, transparent 0.55px)",
          backgroundSize: "28px 28px, 40px 40px",
        }}
      />

      <aside className="relative hidden w-[42%] flex-col justify-between border-r border-border bg-neutral-950 px-10 py-12 text-white lg:flex">
        <div>
          <p className="font-display text-3xl tracking-tight">Bismillah</p>
          <p className="mt-2 text-[11px] tracking-[0.22em] text-white/55 uppercase">
            Staff console
          </p>
        </div>
        <div>
          <h1 className="font-display max-w-xs text-4xl leading-[1.05] tracking-tight">
            Quiet tools for loud leather demand.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/65">
            Orders, flash sale, product films, and security alerts — sign in to continue.
          </p>
        </div>
        <p className="text-xs text-white/40">Rate-limited · lockout after failed attempts</p>
      </aside>

      <main className="relative flex flex-1 items-center justify-center px-4 py-16 sm:px-8">
        <div className="admin-login-card w-full max-w-sm border border-border bg-white p-7 sm:p-9">
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Admin sign in
          </p>
          <h2 className="font-display mt-3 text-3xl tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Email + password for staff only.
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  );
}
