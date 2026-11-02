import { getPrisma } from "@bismillah/db";
import { formatStatementWhen, takaDecimal, type StatementRange } from "./statement-range";

export type StatementLine = {
  at: string;
  kind: "Order" | "Cancelled order" | "Refund";
  reference: string;
  customer: string;
  phone: string;
  orderStatus: string;
  payment: string;
  subtotal: bigint;
  discount: bigint;
  delivery: bigint;
  amount: bigint;
  balance: bigint;
};

export type StatementBook = {
  lines: StatementLine[];
  truncated: boolean;
  orders: number;
  refunds: number;
  gross: bigint;
  discount: bigint;
  delivery: bigint;
  cancelled: bigint;
  refunded: bigint;
  net: bigint;
  collected: bigint;
};

function customerName(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== "object") return "";
  const name = (snapshot as { name?: unknown }).name;
  return typeof name === "string" ? name.trim() : "";
}

export async function loadStatement(range: StatementRange): Promise<StatementBook> {
  const prisma = getPrisma();
  const placed = { gte: range.from, lt: range.to };
  const [orders, refunds, paid] = await Promise.all([
    prisma.order.findMany({
      where: { placedAt: placed },
      orderBy: { placedAt: "asc" },
      take: 5000,
      select: {
        number: true,
        customerPhone: true,
        customerSnapshot: true,
        status: true,
        paymentStatus: true,
        subtotal: true,
        discountTotal: true,
        deliveryFee: true,
        total: true,
        placedAt: true,
      },
    }),
    prisma.refund.findMany({
      where: { createdAt: placed, status: "succeeded" },
      orderBy: { createdAt: "asc" },
      take: 5000,
      select: {
        amount: true,
        reason: true,
        createdAt: true,
        order: { select: { number: true } },
      },
    }),
    prisma.order.aggregate({
      where: { placedAt: placed, paymentStatus: "paid", status: { not: "cancelled" } },
      _sum: { total: true },
    }),
  ]);

  const drafts: { time: number; line: Omit<StatementLine, "balance"> }[] = orders.map((order) => ({
    time: order.placedAt.getTime(),
    line: {
      at: formatStatementWhen(order.placedAt),
      kind: order.status === "cancelled" ? "Cancelled order" : "Order",
      reference: order.number,
      customer: customerName(order.customerSnapshot),
      phone: order.customerPhone,
      orderStatus: order.status,
      payment: order.paymentStatus,
      subtotal: order.subtotal,
      discount: order.discountTotal,
      delivery: order.deliveryFee,
      amount: order.status === "cancelled" ? 0n : order.total,
    },
  }));

  for (const refund of refunds) {
    drafts.push({
      time: refund.createdAt.getTime(),
      line: {
        at: formatStatementWhen(refund.createdAt),
        kind: "Refund",
        reference: refund.order.number,
        customer: refund.reason,
        phone: "",
        orderStatus: "",
        payment: "refunded",
        subtotal: 0n,
        discount: 0n,
        delivery: 0n,
        amount: -refund.amount,
      },
    });
  }

  drafts.sort((a, b) => a.time - b.time);
  let balance = 0n;
  const lines = drafts.map(({ line }) => {
    balance += line.amount;
    return { ...line, balance };
  });

  let gross = 0n;
  let discount = 0n;
  let delivery = 0n;
  let cancelled = 0n;
  for (const order of orders) {
    if (order.status === "cancelled") {
      cancelled += order.total;
      continue;
    }
    gross += order.subtotal;
    discount += order.discountTotal;
    delivery += order.deliveryFee;
  }
  const refunded = refunds.reduce((sum, refund) => sum + refund.amount, 0n);
  const net = lines.reduce((sum, line) => sum + line.amount, 0n);

  return {
    lines,
    truncated: orders.length >= 5000 || refunds.length >= 5000,
    orders: orders.length,
    refunds: refunds.length,
    gross,
    discount,
    delivery,
    cancelled,
    refunded,
    net,
    collected: paid._sum.total ?? 0n,
  };
}

export function statementCsv(range: StatementRange, book: StatementBook) {
  const rows: (string | number)[][] = [
    ["Bismillah Leather"],
    ["Account statement"],
    ["Period", range.label],
    ["Timezone", "Asia/Dhaka"],
    ["Generated", formatStatementWhen(new Date())],
    ["Orders", book.orders],
    ["Gross", takaDecimal(book.gross)],
    ["Discounts", takaDecimal(book.discount)],
    ["Delivery", takaDecimal(book.delivery)],
    ["Refunds", takaDecimal(book.refunded)],
    ["Net", takaDecimal(book.net)],
    ["Collected", takaDecimal(book.collected)],
    [],
    [
      "Date",
      "Type",
      "Reference",
      "Customer",
      "Phone",
      "Order status",
      "Payment",
      "Subtotal",
      "Discount",
      "Delivery",
      "Amount",
      "Balance",
    ],
  ];
  for (const line of book.lines) {
    rows.push([
      line.at,
      line.kind,
      line.reference,
      line.customer,
      line.phone,
      line.orderStatus,
      line.payment,
      takaDecimal(line.subtotal),
      takaDecimal(line.discount),
      takaDecimal(line.delivery),
      takaDecimal(line.amount),
      takaDecimal(line.balance),
    ]);
  }
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell);
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(","),
    )
    .join("\r\n");
  return `\uFEFF${csv}\r\n`;
}
