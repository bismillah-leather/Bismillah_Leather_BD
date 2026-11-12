import { getPrisma } from "@bismillah/db";
import { remember } from "./ttl-cache";

export type DashboardOrder = {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: bigint;
  customerPhone: string;
  placedAt: Date;
};

export type DashboardDay = {
  start: string;
  count: number;
  total: bigint;
};

export type DashboardStats = {
  recentOrders: DashboardOrder[];
  daySeries: DashboardDay[];
  ordersToday: number;
  ordersWeek: number;
  revenueToday: bigint;
  revenueWeek: bigint;
  pending: number;
  unpaid: number;
  unfulfilled: number;
  customersTotal: number;
  customersNewWeek: number;
  lowStock: number;
  outOfStock: number;
  lockedAdmins: number;
  activeCoupons: number;
  statusGroups: { status: string; _count: { _all: number } }[];
  paymentGroups: { paymentStatus: string; _count: { _all: number } }[];
  productGroups: { status: string; _count: { _all: number } }[];
  topProducts: { id: string; name: string; soldCount: number }[];
};

type StatsRow = {
  pending: number;
  unpaid: number;
  unfulfilled: number;
  customers_total: number;
  customers_new_week: number;
  low_stock: number;
  out_of_stock: number;
  locked_admins: number;
  active_coupons: number;
  orders_today: number;
  orders_week: number;
  revenue_today: string;
  revenue_week: string;
  order_status: Record<string, number> | null;
  payment_status: Record<string, number> | null;
  product_status: Record<string, number> | null;
  top_products: { id: string; name: string; sold_count: number }[] | null;
  day_series: { start: string; count: number; total: string }[] | null;
  recent_orders: {
    id: string;
    number: string;
    status: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    total: string;
    customerPhone: string;
    placedAt: string;
  }[] | null;
};

function asGroups(value: Record<string, number> | null, key: "status" | "paymentStatus") {
  return Object.entries(value ?? {}).map(([name, count]) =>
    key === "status"
      ? { status: name, _count: { _all: Number(count) } }
      : { paymentStatus: name, _count: { _all: Number(count) } },
  );
}

function mapOrder(order: NonNullable<StatsRow["recent_orders"]>[number]): DashboardOrder {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    total: BigInt(order.total),
    customerPhone: order.customerPhone,
    placedAt: new Date(order.placedAt),
  };
}

/** One round trip for the overview, reused for a few seconds. */
export function loadDashboardStats(weekAgo: Date, today: Date): Promise<DashboardStats> {
  const key = `dash:${weekAgo.getTime()}:${today.getTime()}`;
  return remember(key, 8_000, async () => {
    const prisma = getPrisma();
    const rows = await prisma.$queryRaw<StatsRow[]>`
      SELECT
        (SELECT count(*)::int FROM orders WHERE status = 'pending'::order_status) AS pending,
        (SELECT count(*)::int FROM orders WHERE payment_status = 'unpaid'::payment_status) AS unpaid,
        (SELECT count(*)::int FROM orders WHERE fulfillment_status = 'unfulfilled'::fulfillment_status) AS unfulfilled,
        (SELECT count(*)::int FROM customers) AS customers_total,
        (SELECT count(*)::int FROM customers WHERE created_at >= ${weekAgo}) AS customers_new_week,
        (SELECT count(*)::int FROM product_variants WHERE is_active AND stock_on_hand > 0 AND stock_on_hand <= 3) AS low_stock,
        (SELECT count(*)::int FROM product_variants WHERE is_active AND stock_on_hand <= 0) AS out_of_stock,
        (SELECT count(*)::int FROM admin_users WHERE locked_until > now()) AS locked_admins,
        (SELECT count(*)::int FROM coupons WHERE is_active) AS active_coupons,
        (SELECT count(*)::int FROM orders WHERE placed_at >= ${today}) AS orders_today,
        (SELECT count(*)::int FROM orders WHERE placed_at >= ${weekAgo}) AS orders_week,
        (SELECT coalesce(sum(total), 0)::text FROM orders WHERE placed_at >= ${today}) AS revenue_today,
        (SELECT coalesce(sum(total), 0)::text FROM orders WHERE placed_at >= ${weekAgo}) AS revenue_week,
        (SELECT coalesce(json_object_agg(status, cnt), '{}'::json) FROM (
          SELECT status::text AS status, count(*)::int AS cnt FROM orders GROUP BY status
        ) s) AS order_status,
        (SELECT coalesce(json_object_agg(payment_status, cnt), '{}'::json) FROM (
          SELECT payment_status::text AS payment_status, count(*)::int AS cnt FROM orders GROUP BY payment_status
        ) s) AS payment_status,
        (SELECT coalesce(json_object_agg(status, cnt), '{}'::json) FROM (
          SELECT status::text AS status, count(*)::int AS cnt FROM products WHERE deleted_at IS NULL GROUP BY status
        ) s) AS product_status,
        (SELECT coalesce(json_agg(t.obj ORDER BY t.sold_count DESC, t.updated_at DESC), '[]'::json) FROM (
          SELECT sold_count, updated_at, json_build_object('id', id, 'name', name, 'sold_count', sold_count) AS obj
          FROM products
          WHERE deleted_at IS NULL AND status = 'published'::product_status
          ORDER BY sold_count DESC, updated_at DESC
          LIMIT 5
        ) t) AS top_products,
        (SELECT coalesce(json_agg(json_build_object(
          'start', day_start,
          'count', cnt,
          'total', revenue
        ) ORDER BY day_start), '[]'::json) FROM (
          SELECT date_trunc('day', placed_at) AS day_start,
                 count(*)::int AS cnt,
                 coalesce(sum(total), 0)::text AS revenue
          FROM orders
          WHERE placed_at >= ${weekAgo}
          GROUP BY 1
        ) d) AS day_series,
        (SELECT coalesce(json_agg(w.obj ORDER BY w.placed_at DESC), '[]'::json) FROM (
          SELECT placed_at, json_build_object(
            'id', id,
            'number', number,
            'status', status::text,
            'paymentStatus', payment_status::text,
            'fulfillmentStatus', fulfillment_status::text,
            'total', total::text,
            'customerPhone', customer_phone,
            'placedAt', placed_at
          ) AS obj
          FROM orders
          ORDER BY placed_at DESC
          LIMIT 8
        ) w) AS recent_orders
    `;

    const row = rows[0];
    if (!row) throw new Error("Dashboard stats query returned no row.");

    return {
      recentOrders: (row.recent_orders ?? []).map(mapOrder),
      daySeries: (row.day_series ?? []).map((day) => ({
        start: day.start,
        count: Number(day.count),
        total: BigInt(day.total),
      })),
      ordersToday: Number(row.orders_today),
      ordersWeek: Number(row.orders_week),
      revenueToday: BigInt(row.revenue_today),
      revenueWeek: BigInt(row.revenue_week),
      pending: Number(row.pending),
      unpaid: Number(row.unpaid),
      unfulfilled: Number(row.unfulfilled),
      customersTotal: Number(row.customers_total),
      customersNewWeek: Number(row.customers_new_week),
      lowStock: Number(row.low_stock),
      outOfStock: Number(row.out_of_stock),
      lockedAdmins: Number(row.locked_admins),
      activeCoupons: Number(row.active_coupons),
      statusGroups: asGroups(row.order_status, "status") as DashboardStats["statusGroups"],
      paymentGroups: asGroups(row.payment_status, "paymentStatus") as DashboardStats["paymentGroups"],
      productGroups: asGroups(row.product_status, "status") as DashboardStats["productGroups"],
      topProducts: (row.top_products ?? []).map((product) => ({
        id: product.id,
        name: product.name,
        soldCount: Number(product.sold_count),
      })),
    };
  });
}
