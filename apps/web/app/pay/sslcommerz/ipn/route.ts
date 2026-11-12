import { applySslNotification, readSslFields } from "@/lib/sslcommerz";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const fields = await readSslFields(request);
    await applySslNotification(fields);
    return new Response("OK");
  } catch (error) {
    console.error("[web] sslcommerz ipn failed:", error);
    return new Response("ERROR", { status: 500 });
  }
}
