import { parse as parseDotenv } from "dotenv";
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

function fillEmptyFromFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  let parsed: Record<string, string> = {};
  try {
    parsed = parseDotenv(fs.readFileSync(filePath));
  } catch {
    return;
  }
  for (const [key, value] of Object.entries(parsed)) {
    if (!value?.trim()) continue;
    const current = process.env[key];
    // Compose can inject empty R2_*= ; treat blank as unset so the file can fill it.
    // Never clobber a non-empty Docker/runtime value.
    if (current === undefined || current.trim() === "") {
      process.env[key] = value;
    }
  }
}

/** Load monorepo root `.env` once (Turbopack workers often miss next.config loadEnvConfig). */
export function loadRootEnv(): void {
  if (loaded) return;
  loaded = true;
  const rootDir = workspaceRoot();
  fillEmptyFromFile(path.join(rootDir, ".env"));
  fillEmptyFromFile(path.join(rootDir, ".env.local"));
}
