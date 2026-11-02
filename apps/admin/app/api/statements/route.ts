import { NextResponse } from "next/server";
import { getActiveAdmin } from "@/lib/admin-auth";
import { loadStatement, statementCsv } from "@/lib/statement-book";
import { resolveStatementRange } from "@/lib/statement-range";

export async function GET(request: Request) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const url = new URL(request.url);
  const range = resolveStatementRange({
    preset: url.searchParams.get("preset") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });
  if (range.error) {
    return NextResponse.json({ error: range.error }, { status: 400 });
  }

  const book = await loadStatement(range);
  const filename = `bismillah-statement-${range.fromDate}_${range.toDate}.csv`;
  return new NextResponse(statementCsv(range, book), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
