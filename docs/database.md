# Database

PostgreSQL 18. Schema in `packages/db/prisma/schema`. Money is integer paisa. Times are `timestamptz`, shown in `Asia/Dhaka` by the apps.

## Catalog

`categories` is a tree (`parent_id` + unique materialized `path`). Soft delete is `deleted_at` on categories and products only.

A product has one primary category, extra categories, options (Color → Black), variants (SKU, price, sale window, cost, stock), media, and filter attributes (material, and later card slots or size).

`stock_on_hand` is what we hold. `stock_reserved` is held for an online payment that has not finished. Available = on hand − reserved. A check constraint keeps reserved from exceeding on hand. Every change also writes `inventory_movements`. Cancelled and returned orders restock through that ledger.

## Orders

Three columns move independently:

| Column | Path |
|---|---|
| `status` | pending → confirmed → completed, or cancelled |
| `payment_status` | unpaid → pending → paid, then failed / refunded / partially refunded. COD stays unpaid until the courier remits cash. |
| `fulfillment_status` | unfulfilled → packed → shipped → delivered, plus failed delivery and returned |

Allowed moves live in `@bismillah/shared` and are what the API will enforce. Each move is appended to `order_status_history`.

`orders.number` is `BL-250001` and upward, from `next_order_number()`. `orders.id` is the internal key. `idempotency_key` is unique so a double tap cannot create two orders.

`channel` is how the order was taken (website, Messenger, WhatsApp, phone). `source` is where the customer came from. UTM fields, click ids, and first-touch / last-touch JSON sit on the same row.

`order_items` copy the name, SKU, price, and image at purchase time.

## What is intentionally not in Postgres

- Live viewers. Redis sorted sets only. The count is never invented.
- Analytics events. GA4 and Meta hold those.
- Admin sessions. Redis, httpOnly cookie, revocable.

## Local database

```bash
pnpm db:up
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Seed loads the nine launch categories, material attributes, Dhaka delivery fees (৳80 inside, ৳130 outside), SMS templates, and a dev owner. Re-running the seed does not reset that password.
