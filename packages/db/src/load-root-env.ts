import { config as loadDotenv } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let loaded = false;

function workspaceRoot() {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");
}

/** Load monorepo root `.env` once (Turbopack workers often miss next.config loadEnvConfig). */
export function loadRootEnv(): void {
  if (loaded) return;
  loaded = true;
  const rootDir = workspaceRoot();
  loadDotenv({ path: path.join(rootDir, ".env"), override: true });
  loadDotenv({ path: path.join(rootDir, ".env.local"), override: true });
}
