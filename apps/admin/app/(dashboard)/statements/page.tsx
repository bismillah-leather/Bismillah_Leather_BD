import { formatPaisa } from "@bismillah/shared";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-page-header";
import { requireAdmin } from "@/lib/admin-auth";
import { loadStatement } from "@/lib/statement-book";
import { formatStatementWhen, resolveStatementRange, takaDecimal } from "@/lib/statement-range";
import { PrintStatementButton } from "./print-button";

const PRESETS = [
  { id: "today", label: "Today" },
  { id: "month", label: "This month" },
  { id: "last", label: "Last month" },
] as const;

export default async function StatementsPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const range = resolveStatementRange(sp);
  const book = range.error ? null : await loadStatement(range);
  const query = new URLSearchParams({
    preset: range.preset,
    from: range.fromDate,
    to: range.toDate,
  });
  const downloadHref = `/admin/api/statements?${query.toString()}`;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Accounts"
        title="Statements"
        description="A shop statement in Bangladesh time. Pick a day, a month, or your own dates, then download it like a bank statement."
      />

      <form action="/admin/statements" className="statement-controls mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Link
              key={preset.id}
              href={`/statements?preset=${preset.id}`}
              data-active={range.preset === preset.id ? "true" : "false"}
              className="inline-flex h-10 items-center rounded-full border border-white/12 px-4 text-[11px] tracking-wide uppercase data-[active=true]:border-[#c6a15b] data-[active=true]:bg-[#c6a15b] data-[active=true]:text-[#1a140f]"
            >
              {preset.label}
            </Link>
          ))}
        </div>
        <input type="hidden" name="preset" value="custom" />
        <label className="grid gap-1 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          From
          <input type="date" name="from" defaultValue={range.fromDate} className="admin-field h-10" required />
        </label>
        <label className="grid gap-1 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          To
          <input type="date" name="to" defaultValue={range.toDate} className="admin-field h-10" required />
        </label>
        <button type="submit" className="admin-btn-primary h-10 px-4 text-[11px]">
          Custom range
        </button>
        <a href={downloadHref} className="admin-btn-ghost h-10 px-4 text-[11px]">
          Download CSV
        </a>
        <PrintStatementButton />
      </form>
      {range.error ? <p className="mt-3 text-sm text-[#f0b2a6]">{range.error}</p> : null}

      {book ? (
        <article className="statement-sheet mt-6 overflow-hidden rounded-2xl bg-[#f6f1e8] text-[#1c1612] shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e4d8c4] px-6 py-6 sm:px-8">
            <div>
              <p className="text-[11px] tracking-[0.22em] text-[#8a7044] uppercase">Bismillah Leather</p>
              <h2 className="font-display mt-2 text-3xl tracking-tight">Account statement</h2>
              <p className="mt-2 text-sm text-[#5c5146]">{range.label} · Asia/Dhaka</p>
            </div>
            <p className="text-xs text-[#5c5146]">Issued {formatStatementWhen(new Date())}</p>
          </header>

          <dl className="grid grid-cols-2 gap-px bg-[#e4d8c4] sm:grid-cols-4">
            <Figure label="Orders" value={String(book.orders)} />
            <Figure label="Gross" value={formatPaisa(book.gross)} />
            <Figure label="Net" value={formatPaisa(book.net)} />
            <Figure label="Collected" value={formatPaisa(book.collected)} />
          </dl>
          <p className="px-6 py-3 text-xs text-[#5c5146] sm:px-8">
            Discounts {formatPaisa(book.discount)} · Delivery {formatPaisa(book.delivery)} · Refunds{" "}
            {formatPaisa(book.refunded)}
            {book.cancelled > 0n ? ` · Cancelled ${formatPaisa(book.cancelled)} kept off the balance` : ""}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="bg-[#efe6d6] text-[10px] tracking-[0.14em] text-[#6d5c45] uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium sm:px-6">Date</th>
                  <th className="px-3 py-3 font-medium">Reference</th>
                  <th className="px-3 py-3 font-medium">Details</th>
                  <th className="px-3 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium sm:px-6">Balance</th>
                </tr>
              </thead>
              <tbody>
                {book.lines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-sm text-[#5c5146]">
                      No orders or refunds in this period.
                    </td>
                  </tr>
                ) : (
                  book.lines.map((line, index) => (
                    <tr key={`${line.reference}-${line.kind}-${index}`} className="border-t border-[#eadfce]">
                      <td className="px-4 py-3 whitespace-nowrap text-[#5c5146] sm:px-6">{line.at}</td>
                      <td className="px-3 py-3 font-medium whitespace-nowrap">{line.reference}</td>
                      <td className="px-3 py-3">
                        <p>{line.kind}</p>
                        <p className="text-xs text-[#5c5146]">
                          {[line.customer, line.phone, line.payment].filter(Boolean).join(" · ")}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">
                        {line.amount < 0n ? "−" : ""}
                        {formatPaisa(line.amount < 0n ? -line.amount : line.amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium whitespace-nowrap tabular-nums sm:px-6">
                        {formatPaisa(line.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <footer className="flex flex-wrap items-end justify-between gap-3 border-t border-[#e4d8c4] px-6 py-5 text-xs text-[#5c5146] sm:px-8">
            <p>Closing balance {formatPaisa(book.net)} · {takaDecimal(book.net)} BDT</p>
            {book.truncated ? <p>This view stops at 5,000 lines. Download the CSV for the same cut.</p> : null}
          </footer>
        </article>
      ) : null}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f6f1e8] px-4 py-4 sm:px-6">
      <dt className="text-[10px] tracking-[0.16em] text-[#8a7044] uppercase">{label}</dt>
      <dd className="font-display mt-1 text-xl tracking-tight tabular-nums">{value}</dd>
    </div>
  );
}
