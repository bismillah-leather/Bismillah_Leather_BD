/** Shop statements use Bangladesh time, which does not observe daylight saving. */
const OFFSET_MS = 6 * 60 * 60 * 1000;
const MAX_DAYS = 366;

export type StatementPreset = "today" | "month" | "last" | "custom";

export type StatementRange = {
  preset: StatementPreset;
  from: Date;
  to: Date;
  fromDate: string;
  toDate: string;
  label: string;
  error?: string;
};

type Ymd = { y: number; m: number; d: number };

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function stamp(parts: Ymd) {
  return `${parts.y}-${pad(parts.m)}-${pad(parts.d)}`;
}

export function dhakaParts(date: Date): Ymd {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [y, m, d] = formatted.split("-").map(Number);
  return { y: y ?? 1970, m: m ?? 1, d: d ?? 1 };
}

function zonedStart(parts: Ymd) {
  return new Date(Date.UTC(parts.y, parts.m - 1, parts.d, 0, 0, 0) - OFFSET_MS);
}

function addDays(parts: Ymd, days: number): Ymd {
  return dhakaParts(new Date(zonedStart(parts).getTime() + days * 86_400_000));
}

function parseYmd(value: string | undefined): Ymd | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const parts = { y, m, d };
  const check = dhakaParts(zonedStart(parts));
  if (check.y !== y || check.m !== m || check.d !== d) return null;
  return parts;
}

function monthBounds(y: number, m: number) {
  const from = { y, m, d: 1 };
  const next = m === 12 ? { y: y + 1, m: 1, d: 1 } : { y, m: m + 1, d: 1 };
  return { from, next, last: addDays(next, -1) };
}

function build(preset: StatementPreset, from: Ymd, last: Ymd, next: Ymd, error?: string): StatementRange {
  return {
    preset,
    from: zonedStart(from),
    to: zonedStart(next),
    fromDate: stamp(from),
    toDate: stamp(last),
    label: stamp(from) === stamp(last) ? stamp(from) : `${stamp(from)} – ${stamp(last)}`,
    ...(error ? { error } : {}),
  };
}

export function resolveStatementRange(
  input: { preset?: string; from?: string; to?: string },
  now = new Date(),
): StatementRange {
  const today = dhakaParts(now);
  const current = monthBounds(today.y, today.m);
  const previousMonth = today.m === 1 ? monthBounds(today.y - 1, 12) : monthBounds(today.y, today.m - 1);
  const preset = input.preset === "today" || input.preset === "last" || input.preset === "custom" ? input.preset : "month";

  if (preset === "today") {
    return build("today", today, today, addDays(today, 1));
  }
  if (preset === "last") {
    return build("last", previousMonth.from, previousMonth.last, previousMonth.next);
  }
  if (preset === "custom") {
    const from = parseYmd(input.from);
    const to = parseYmd(input.to);
    if (!from || !to) {
      return build("custom", current.from, current.last, current.next, "Choose both a start and an end date.");
    }
    if (zonedStart(from).getTime() > zonedStart(to).getTime()) {
      return build("custom", current.from, current.last, current.next, "The start date has to be before the end date.");
    }
    const next = addDays(to, 1);
    const days = Math.round((zonedStart(next).getTime() - zonedStart(from).getTime()) / 86_400_000);
    if (days > MAX_DAYS) {
      return build("custom", current.from, current.last, current.next, "A statement can cover at most 366 days.");
    }
    return build("custom", from, to, next);
  }
  return build("month", current.from, current.last, current.next);
}

export function formatStatementWhen(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function takaDecimal(paisa: bigint) {
  const negative = paisa < 0n;
  const abs = negative ? -paisa : paisa;
  const whole = abs / 100n;
  const frac = (abs % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${frac}`;
}
