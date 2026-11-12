import { getPrisma } from "@bismillah/db";
import { forgetAdminLists, remember } from "./ttl-cache";

export type SecurityAlert = {
  id: string;
  at: string;
  kind:
    | "admin_login_fail"
    | "admin_lockout"
    | "admin_rate_limit"
    | "admin_master_login"
    | "admin_register"
    | "customer_rate_limit"
    | "checkout_rate_limit"
    | "fake_order";
  ip?: string;
  detail: string;
};

const KEY = "security.alerts";
const MAX = 50;

export async function pushSecurityAlert(
  alert: Omit<SecurityAlert, "id" | "at"> & { at?: string },
): Promise<void> {
  const prisma = getPrisma();
  const row = await prisma.setting.findUnique({ where: { key: KEY } });
  const prev = Array.isArray(row?.value) ? (row.value as SecurityAlert[]) : [];
  const next: SecurityAlert[] = [
    {
      id: crypto.randomUUID(),
      at: alert.at ?? new Date().toISOString(),
      kind: alert.kind,
      ip: alert.ip,
      detail: alert.detail,
    },
    ...prev,
  ].slice(0, MAX);

  await prisma.setting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: next },
    update: { value: next },
  });
  forgetAdminLists();
}

export async function listSecurityAlerts(limit = 30): Promise<SecurityAlert[]> {
  const list = await remember("security-alerts", 8_000, async () => {
    const prisma = getPrisma();
    const row = await prisma.setting.findUnique({ where: { key: KEY } });
    return (Array.isArray(row?.value) ? row.value : []) as SecurityAlert[];
  });
  return list.slice(0, limit);
}
