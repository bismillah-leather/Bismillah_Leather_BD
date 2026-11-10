import {
  defaultFlashSale,
  isFlashSaleLive,
  serializeFlashSale,
  type FlashSaleConfig,
} from "@bismillah/shared";
import { readStoredFlashSale, writeStoredFlashSale } from "@bismillah/db";
import { promises as fs } from "node:fs";
import path from "node:path";
import { remember, forget } from "./remember";

const DATA_PATH = path.join(process.cwd(), "data", "flash-sale.json");

async function readFileSale(): Promise<FlashSaleConfig | null> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    return serializeFlashSale(JSON.parse(raw) as FlashSaleConfig);
  } catch {
    return null;
  }
}

export async function writeFlashSale(sale: FlashSaleConfig): Promise<void> {
  forget("flash-sale");
  await writeStoredFlashSale(sale);
  try {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, `${JSON.stringify(serializeFlashSale(sale), null, 2)}\n`, "utf8");
  } catch {
    // Production hosts often have a read-only filesystem. The database copy is enough.
  }
}

/** Read-only load for render paths. Avoids filesystem writes during prerender. */
export function readFlashSale(): Promise<FlashSaleConfig> {
  return remember("flash-sale", 15_000, loadFlashSale);
}

async function loadFlashSale(): Promise<FlashSaleConfig> {
  try {
    const stored = await readStoredFlashSale();
    if (stored) {
      if (stored.isActive && !isFlashSaleLive(stored)) return defaultFlashSale();
      return stored;
    }
  } catch (error) {
    console.error("[web] flash sale database read failed:", error);
  }

  const fromFile = await readFileSale();
  if (fromFile) {
    if (fromFile.isActive && !isFlashSaleLive(fromFile)) return defaultFlashSale();
    return fromFile;
  }
  return defaultFlashSale();
}
