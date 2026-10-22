import { getPrisma } from "@bismillah/db";
import { normalizeBdPhone } from "@bismillah/shared";
import { redirect } from "next/navigation";
import {
  clearCustomerSessionCookie,
  getCustomerSession,
  setCustomerSessionCookie,
  signCustomerSession,
  type CustomerSession,
} from "./customer-session";

export async function requireCustomer(): Promise<CustomerSession> {
  const session = await getCustomerSession();
  if (!session) redirect("/account/login");

  const prisma = getPrisma();
  const customer = await prisma.customer.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, phone: true, isBlocked: true },
  });
  if (!customer || customer.isBlocked) {
    await clearCustomerSessionCookie();
    redirect("/account/login");
  }
  return { sub: customer.id, name: customer.name, phone: customer.phone };
}

export type CustomerLoginResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function loginOrRegisterCustomer(
  name: string,
  phoneRaw: string,
): Promise<CustomerLoginResult> {
  const phone = normalizeBdPhone(phoneRaw);
  if (!phone) {
    return { ok: false, error: "Enter a valid BD mobile (01XXXXXXXXX).", status: 400 };
  }
  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    return { ok: false, error: "Name must be at least 2 characters.", status: 400 };
  }

  const prisma = getPrisma();
  const existing = await prisma.customer.findUnique({ where: { phone } });
  if (existing?.isBlocked) {
    return { ok: false, error: "This account is blocked. Contact support.", status: 403 };
  }

  const customer =
    existing ??
    (await prisma.customer.create({
      data: { name: trimmedName, phone },
    }));

  if (existing && existing.name !== trimmedName) {
    await prisma.customer.update({
      where: { id: existing.id },
      data: { name: trimmedName },
    });
  }

  const token = await signCustomerSession({
    sub: customer.id,
    phone: customer.phone,
    name: trimmedName,
  });
  await setCustomerSessionCookie(token);
  return { ok: true };
}

export async function logoutCustomer() {
  await clearCustomerSessionCookie();
}
