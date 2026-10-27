import {
  defaultFlashSale,
  isFlashSaleLive,
  serializeFlashSale,
  type FlashSaleConfig,
} from "@bismillah/shared";
import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_PATH = path.join(process.cwd(), "data", "flash-sale.json");

export async function writeFlashSale(sale: FlashSaleConfig): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, `${JSON.stringify(serializeFlashSale(sale), null, 2)}\n`, "utf8");
}

/** Read-only load for render paths. Avoids filesystem writes during prerender. */
export async function readFlashSale(): Promise<FlashSaleConfig> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    const parsed = serializeFlashSale(JSON.parse(raw) as FlashSaleConfig);
    if (parsed.isActive && !isFlashSaleLive(parsed)) {
      return defaultFlashSale();
    }
    return parsed;
  } catch {
    return defaultFlashSale();
  }
}
