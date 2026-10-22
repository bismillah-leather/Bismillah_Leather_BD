import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-session";
import { AccountLoginForm } from "./login-form";

async function LoginGate() {
  const session = await getCustomerSession();
  if (session) redirect("/account");
  return <AccountLoginForm />;
}

export default function AccountLoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-4xl">Your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in with your name and Bangladesh mobile. Orders placed with this number
        show up here.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <LoginGate />
        </Suspense>
      </div>
    </div>
  );
}
