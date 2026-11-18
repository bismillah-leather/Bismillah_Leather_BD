import { NextResponse } from "next/server";
import { applyEpsReturn, readEpsFields } from "@/lib/eps";

export async function finishEps(request: Request, hint: "success" | "fail" | "cancel" | "ipn") {
  const fields = await readEpsFields(request);
  const result = await applyEpsReturn(fields, hint);
  const back = new URL("/pay/eps/result", request.url);
  if (result.ok) {
    back.searchParams.set("order", result.number);
    if (result.token) back.searchParams.set("token", result.token);
    back.searchParams.set("state", result.state);
  } else {
    back.searchParams.set("state", hint === "cancel" ? "cancelled" : "failed");
  }
  return NextResponse.redirect(back, 303);
}
