import { getPrisma } from "@bismillah/db";
import { hash, verify } from "@node-rs/argon2";
import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { cache } from "react";
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

const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export async function hashAdminPassword(password: string): Promise<string> {
  return hash(password, ARGON);
}

export async function verifyAdminPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  return verify(passwordHash, password);
}

export type AdminRoleName = "owner" | "manager" | "staff" | "support";

const REGISTERABLE_ROLES = new Set<AdminRoleName>(["manager", "staff", "support"]);

function masterKeyMatches(input: string): boolean {
  const expected = process.env.ADMIN_MASTER_KEY?.trim() ?? "";
  if (!expected || expected.length < 12) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isMasterKeyConfigured(): boolean {
  const expected = process.env.ADMIN_MASTER_KEY?.trim() ?? "";
  return expected.length >= 12;
}

const ACTIVE_MS = 30_000;
const activeCache = new Map<string, { expires: number; session: AdminSession }>();

/** Drop a cached staff row after logout, deactivation, or a profile change. */
export function forgetAdminCache(id: string) {
  activeCache.delete(id);
}

async function resolveAdmin(session: AdminSession): Promise<AdminSession | null> {
  const hit = activeCache.get(session.sub);
  if (hit && hit.expires > Date.now()) return hit.session;

  const prisma = getPrisma();
  const user = await prisma.adminUser.findUnique({
    where: { id: session.sub },
    select: { id: true, isActive: true, email: true, name: true, role: true },
  });
  if (!user?.isActive) {
    activeCache.delete(session.sub);
    return null;
  }
  const next: AdminSession = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  activeCache.set(user.id, { expires: Date.now() + ACTIVE_MS, session: next });
  return next;
}

export const requireAdmin = cache(async (): Promise<AdminSession> => {
  const session = await getAdminSession();
  // Cookie clear happens in proxy / logout route — not in RSC.
  if (!session) redirect("/");
  const user = await resolveAdmin(session);
  if (!user) redirect("/");
  return user;
});

/** For route handlers — returns null instead of redirecting. */
export async function getActiveAdmin(): Promise<AdminSession | null> {
  const session = await getAdminSession();
  if (!session) return null;
  return resolveAdmin(session);
}

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

async function completeLogin(
  user: { id: string; email: string; name: string; role: string },
  ip: string,
): Promise<LoginResult> {
  const prisma = getPrisma();
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
      after: { via: "password" },
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

/** Staff login — email + password only. Master key is register-only. */
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

  return completeLogin(user, ip);
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
  if (session) forgetAdminCache(session.sub);
  await clearAdminSessionCookie();
}

export type RegisterAdminInput = {
  name: string;
  email: string;
  password: string;
  role?: string;
  /** Required when caller is not a logged-in owner. */
  masterKey?: string;
  ip: string;
  /** Optional actor when an owner creates staff from dashboard. */
  actorId?: string | null;
};

export type RegisterAdminResult =
  | { ok: true; id: string; email: string }
  | { ok: false; error: string; status: number };

export async function registerAdmin(input: RegisterAdminInput): Promise<RegisterAdminResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const roleRaw = (input.role ?? "staff").trim().toLowerCase() as AdminRoleName;

  if (name.length < 2) {
    return { ok: false, error: "Name must be at least 2 characters.", status: 400 };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email.", status: 400 };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters.", status: 400 };
  }
  if (!REGISTERABLE_ROLES.has(roleRaw)) {
    return {
      ok: false,
      error: "Role must be manager, staff, or support. Owner is seed-only.",
      status: 400,
    };
  }

  const prisma = getPrisma();
  let authorized = false;
  let actorId: string | null = input.actorId ?? null;

  if (actorId) {
    const actor = await prisma.adminUser.findUnique({
      where: { id: actorId },
      select: { id: true, role: true, isActive: true },
    });
    if (actor?.isActive && (actor.role === "owner" || actor.role === "manager")) {
      authorized = true;
    }
  }

  if (!authorized) {
    if (!input.masterKey || !masterKeyMatches(input.masterKey)) {
      await pushSecurityAlert({
        kind: "admin_login_fail",
        ip: input.ip,
        detail: `Blocked admin registration attempt for ${email}`,
      });
      return {
        ok: false,
        error: "Master key required to register a new admin.",
        status: 403,
      };
    }
    authorized = true;
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "An admin with this email already exists.", status: 409 };
  }

  const passwordHash = await hash(password, ARGON);
  const user = await prisma.adminUser.create({
    data: {
      name,
      email,
      passwordHash,
      role: roleRaw,
      isActive: true,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "admin.register",
      entityType: "AdminUser",
      entityId: user.id,
      after: { email: user.email, role: user.role, via: actorId ? "owner" : "master_key" },
      ip: input.ip,
    },
  });

  await pushSecurityAlert({
    kind: "admin_register",
    ip: input.ip,
    detail: `Registered admin ${user.email} (${user.role}) via ${actorId ? "session" : "master_key"}`,
  });

  return { ok: true, id: user.id, email: user.email };
}
