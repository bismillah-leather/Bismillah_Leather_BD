import { getPrisma } from "@bismillah/db";
import { divisionForDistrict, normalizeBdPhone } from "@bismillah/shared";
import { redirect } from "next/navigation";
import {
  clearCustomerSessionCookie,
  getCustomerSession,
  MAX_AGE_DEFAULT,
  MAX_AGE_REMEMBER,
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

export type CustomerAuthMode = "signin" | "register";

export type RegisterInput = {
  name: string;
  phoneRaw: string;
  email?: string;
  district?: string;
  addressLine?: string;
  whatsappOk?: boolean;
  termsAccepted?: boolean;
  remember?: boolean;
};

function normalizeEmail(raw: string | undefined): string | null {
  const email = raw?.trim().toLowerCase() ?? "";
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

async function issueSession(
  customer: { id: string; phone: string; name: string },
  remember = false,
) {
  const maxAge = remember ? MAX_AGE_REMEMBER : MAX_AGE_DEFAULT;
  const token = await signCustomerSession(
    {
      sub: customer.id,
      phone: customer.phone,
      name: customer.name,
    },
    maxAge,
  );
  await setCustomerSessionCookie(token, maxAge);
}

export async function signInCustomer(
  phoneRaw: string,
  remember = false,
): Promise<CustomerLoginResult> {
  const phone = normalizeBdPhone(phoneRaw);
  if (!phone) {
    return { ok: false, error: "Enter a valid BD mobile (01XXXXXXXXX).", status: 400 };
  }

  const prisma = getPrisma();
  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer) {
    return {
      ok: false,
      error: "No account for this number. Create one under Register.",
      status: 404,
    };
  }
  if (customer.isBlocked) {
    return { ok: false, error: "This account is blocked. Contact support.", status: 403 };
  }

  await issueSession(customer, remember);
  return { ok: true };
}

export async function registerCustomer(input: RegisterInput): Promise<CustomerLoginResult> {
  if (!input.termsAccepted) {
    return { ok: false, error: "Please accept the privacy & returns notes.", status: 400 };
  }

  const phone = normalizeBdPhone(input.phoneRaw);
  if (!phone) {
    return { ok: false, error: "Enter a valid BD mobile (01XXXXXXXXX).", status: 400 };
  }
  const trimmedName = input.name.trim();
  if (trimmedName.length < 2) {
    return { ok: false, error: "Name must be at least 2 characters.", status: 400 };
  }

  const emailRaw = input.email?.trim() ?? "";
  const email = emailRaw ? normalizeEmail(emailRaw) : null;
  if (emailRaw && !email) {
    return { ok: false, error: "Enter a valid email, or leave it blank.", status: 400 };
  }

  const district = input.district?.trim() || "";
  const addressLine = input.addressLine?.trim() || "";
  const noteBits = [
    input.whatsappOk ? "whatsapp_ok:yes" : "whatsapp_ok:no",
    district ? `district:${district}` : null,
  ].filter(Boolean);

  const prisma = getPrisma();
  const existing = await prisma.customer.findUnique({ where: { phone } });
  if (existing?.isBlocked) {
    return { ok: false, error: "This account is blocked. Contact support.", status: 403 };
  }

  const customer = existing
    ? await prisma.customer.update({
        where: { id: existing.id },
        data: {
          name: trimmedName,
          email: email ?? existing.email,
          notes: noteBits.join(" · ") || existing.notes,
        },
      })
    : await prisma.customer.create({
        data: {
          name: trimmedName,
          phone,
          email,
          notes: noteBits.join(" · ") || null,
        },
      });

  if (district || addressLine) {
    const hasDefault = await prisma.address.findFirst({
      where: { customerId: customer.id, isDefault: true },
      select: { id: true },
    });
    if (!hasDefault) {
      await prisma.address.create({
        data: {
          customerId: customer.id,
          division: divisionForDistrict(district || "Dhaka"),
          district: district || "Dhaka",
          addressLine: addressLine || "To be confirmed on call",
          isDefault: true,
        },
      });
    }
  }

  await issueSession(customer, Boolean(input.remember));
  return { ok: true };
}

export async function loginOrRegisterCustomer(
  name: string,
  phoneRaw: string,
): Promise<CustomerLoginResult> {
  return registerCustomer({
    name,
    phoneRaw,
    termsAccepted: true,
  });
}

export async function logoutCustomer() {
  await clearCustomerSessionCookie();
}
