# Bismillah Leather

Storefront, admin, API, and worker for a leather-goods shop. PostgreSQL is the source of truth. The storefront is a Next.js app. Business rules will live in the API, not in the pages.

## Apps

| Package | What it is |
|---|---|
| `apps/web` | Storefront, port 3000 |
| `apps/admin` | Admin shell, port 3001 |
| `apps/api` | Express API, port 4000 |
| `packages/db` | Prisma schema, migrations, seed |
| `packages/shared` | Money, phone, order state machines |
| `packages/ui` | Design tokens and UI primitives |

## Run locally

```bash
pnpm install
pnpm db:up
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Copy `.env.example` to `packages/db/.env` before the database commands. The dev owner is `owner@bismillah.local`. The seed password is in `.env.example` and is for local use only.

`pnpm test` runs the shared domain tests (money, phone numbers, order transitions).
