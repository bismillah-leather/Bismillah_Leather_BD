import { NextResponse } from "next/server";
import { applySslNotification, readSslFields } from "@/lib/sslcommerz";

export const dynamic = "force-dynamic";

async function finish(request: Request) {
  const fields = await readSslFields(request);
  const result = await applySslNotification(fields);
  const back = new URL("/pay/sslcommerz/result", request.url);
  if (result.ok) {
    back.searchParams.set("order", result.number);
    if (result.token) back.searchParams.set("token", result.token);
    back.searchParams.set("state", result.state);
  } else {
    back.searchParams.set("state", "failed");
  }
  return NextResponse.redirect(back, 303);
}

export function POST(request: Request) {
  return finish(request);
}

export function GET(request: Request) {
  return finish(request);
}
