import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-session";
import { AccountAuthPanel } from "./auth-panel";

async function AuthGate() {
  const session = await getCustomerSession();
  if (session) redirect("/account");
  return <AccountAuthPanel />;
}

export default function AccountLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          Loading account…
        </div>
      }
    >
      <AuthGate />
    </Suspense>
  );
}
