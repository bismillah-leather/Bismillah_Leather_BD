import { getPrisma } from "@bismillah/db";
import { verify } from "@node-rs/argon2";
import { redirect } from "next/navigation";
import {
  clearAdminSessionCookie,
  getAdminSession,
  setAdminSessionCookie,
  signAdminSession,
  type AdminSession,
} from "./session";
import { pushSecurityAlert } from "./security-alerts";

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/login");

  const prisma = getPrisma();
  const user = await prisma.adminUser.findUnique({
    where: { id: session.sub },
    select: { id: true, isActive: true, email: true, name: true, role: true },
  });
  if (!user?.isActive) {
    await clearAdminSessionCookie();
    redirect("/login");
  }
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function loginAdmin(
  email: string,
  password: string,
  ip: string,
): Promise<LoginResult> {
  const prisma = getPrisma();
  const normalized = email.trim().toLowerCase();
  const user = await prisma.adminUser.findUnique({ where: { email: normalized } });

  if (!user || !user.isActive) {
    await pushSecurityAlert({
      kind: "admin_login_fail",
      ip,
      detail: `Unknown or inactive email: ${normalized}`,
    });
    return { ok: false, error: "Invalid email or password.", status: 401 };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
    return {
      ok: false,
      error: `Account locked. Try again in ${mins} minute(s).`,
      status: 423,
    };
  }

  const valid = await verify(user.passwordHash, password);
  if (!valid) {
    const fails = user.failedLoginCount + 1;
    const lockedUntil = fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MS) : null;
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        failedLoginCount: fails,
        lockedUntil,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "admin.login_fail",
        entityType: "AdminUser",
        entityId: user.id,
        after: { fails, locked: Boolean(lockedUntil) },
        ip,
      },
    });
    await pushSecurityAlert({
      kind: lockedUntil ? "admin_lockout" : "admin_login_fail",
      ip,
      detail: lockedUntil
        ? `Locked ${user.email} after ${fails} failed attempts`
        : `Failed login for ${user.email} (${fails}/${MAX_FAILS})`,
    });
    return { ok: false, error: "Invalid email or password.", status: 401 };
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "admin.login",
      entityType: "AdminUser",
      entityId: user.id,
      ip,
    },
  });

  const token = await signAdminSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setAdminSessionCookie(token);
  return { ok: true };
}

export async function logoutAdmin() {
  const session = await getAdminSession();
  if (session) {
    try {
      const prisma = getPrisma();
      await prisma.auditLog.create({
        data: {
          actorId: session.sub,
          action: "admin.logout",
          entityType: "AdminUser",
          entityId: session.sub,
        },
      });
    } catch {
      // ignore audit failures on logout
    }
  }
  await clearAdminSessionCookie();
}
