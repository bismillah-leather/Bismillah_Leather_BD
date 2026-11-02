import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

let loaded = false;

/** Load monorepo root `.env` once (Turbopack workers often miss next.config loadEnvConfig). */
export function loadRootEnv(): void {
  if (loaded) return;
  loaded = true;
  const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  loadDotenv({ path: path.join(rootDir, ".env") });
  loadDotenv({ path: path.join(rootDir, ".env.local"), override: true });
}
