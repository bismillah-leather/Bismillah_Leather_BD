import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const CUSTOMER_SESSION_COOKIE = "bl_customer_session";
const MAX_AGE_DEFAULT = 60 * 60 * 24 * 30; // 30 days
const MAX_AGE_REMEMBER = 60 * 60 * 24 * 90; // 90 days

export type CustomerSession = {
  sub: string;
  phone: string;
  name: string;
};

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (16+ chars)");
  }
  return new TextEncoder().encode(secret);
}

export async function signCustomerSession(
  payload: CustomerSession,
  maxAgeSec = MAX_AGE_DEFAULT,
): Promise<string> {
  return new SignJWT({ phone: payload.phone, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(secretKey());
}

export async function verifyCustomerToken(token: string): Promise<CustomerSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      phone: String(payload.phone ?? ""),
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}

export async function setCustomerSessionCookie(
  token: string,
  maxAgeSec = MAX_AGE_DEFAULT,
) {
  const jar = await cookies();
  jar.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSec,
  });
}

export async function clearCustomerSessionCookie() {
  const jar = await cookies();
  jar.set(CUSTOMER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export { MAX_AGE_DEFAULT, MAX_AGE_REMEMBER };
