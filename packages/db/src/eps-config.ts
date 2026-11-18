import { loadRootEnv } from "./load-root-env";
import { readJsonSetting, writeJsonSetting } from "./json-setting";

export type EpsMode = "sandbox" | "live";

export type EpsConfig = {
  enabled: boolean;
  mode: EpsMode;
  username: string;
  password: string;
  hashKey: string;
  merchantId: string;
  storeId: string;
};

const KEY = "payments.eps";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function fromRecord(row: Record<string, unknown>, env: NodeJS.ProcessEnv): EpsConfig {
  const mode = text(row.mode) || text(env.EPS_MODE);
  const envOff = text(env.EPS_ENABLED).toLowerCase() === "false";
  return {
    enabled: !envOff && row.enabled !== false,
    mode: mode === "sandbox" ? "sandbox" : "live",
    username: text(row.username) || text(env.EPS_USERNAME),
    password: text(row.password) || text(env.EPS_PASSWORD),
    hashKey: text(row.hashKey) || text(env.EPS_HASH_KEY),
    merchantId: text(row.merchantId) || text(env.EPS_MERCHANT_ID),
    storeId: text(row.storeId) || text(env.EPS_STORE_ID),
  };
}

export function epsConfigReady(config: EpsConfig) {
  return Boolean(
    config.enabled &&
      config.username &&
      config.password &&
      config.hashKey &&
      config.merchantId &&
      config.storeId,
  );
}

export async function readEpsConfig(): Promise<EpsConfig> {
  loadRootEnv();
  const stored = await readJsonSetting(KEY);
  const row =
    stored && typeof stored === "object" && !Array.isArray(stored)
      ? (stored as Record<string, unknown>)
      : {};
  return fromRecord(row, process.env);
}

export async function writeEpsConfig(patch: Partial<EpsConfig>): Promise<EpsConfig> {
  const current = await readEpsConfig();
  const next: EpsConfig = {
    enabled: patch.enabled ?? current.enabled ?? true,
    mode: patch.mode ?? current.mode,
    username: patch.username?.trim() || current.username,
    password: patch.password?.trim() || current.password,
    hashKey: patch.hashKey?.trim() || current.hashKey,
    merchantId: patch.merchantId?.trim() || current.merchantId,
    storeId: patch.storeId?.trim() || current.storeId,
  };
  await writeJsonSetting(KEY, next);
  return next;
}

export function publicEpsConfig(config: EpsConfig) {
  return {
    enabled: config.enabled,
    mode: config.mode,
    username: config.username,
    merchantId: config.merchantId,
    storeId: config.storeId,
    hasPassword: Boolean(config.password),
    hasHashKey: Boolean(config.hashKey),
    ready: epsConfigReady(config),
  };
}
