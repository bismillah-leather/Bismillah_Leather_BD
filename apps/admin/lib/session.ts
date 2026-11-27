import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";

export const ADMIN_SESSION_COOKIE = "bl_admin_session";
const COOKIE_PATH = "/admin";
const MAX_AGE_SEC = 60 * 60 * 12; // 12h

export type AdminSession = {
  sub: string;
  email: string;
  name: string;
  role: string;
};

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (16+ chars)");
  }
  return new TextEncoder().encode(secret);
}

export async function signAdminSession(payload: AdminSession): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(secretKey());
}

export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 16) return null;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: String(payload.role ?? "staff"),
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

async function cookieDomain() {
  try {
    const h = await headers();
    const hostHeader = h.get("x-forwarded-host") || h.get("host") || "";
    const host = (hostHeader.split(":")[0] || "").toLowerCase();
    if (host === "bismillahleatherbd.com" || host === "www.bismillahleatherbd.com") {
      return "bismillahleatherbd.com";
    }
  } catch {
    /* route handlers without request headers */
  }
  return undefined;
}

function cookieBase(domain?: string) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: COOKIE_PATH,
    ...(domain ? { domain } : {}),
  };
}

export async function setAdminSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, token, {
    ...cookieBase(await cookieDomain()),
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearAdminSessionCookie() {
  const jar = await cookies();
  const domain = await cookieDomain();
  jar.set(ADMIN_SESSION_COOKIE, "", { ...cookieBase(domain), maxAge: 0 });
}
