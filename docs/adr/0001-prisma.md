# ADR 0001 — Prisma for the database, money in paisa

## Status

Accepted

## Context

The technical specification names Drizzle as the default ORM and lists Prisma as an acceptable alternative. The client asked for Prisma. The catalog, three order state machines, and stock ledger have to stay stable for years, so the schema is designed before feature work.

## Decision

- PostgreSQL is the source of truth. Prisma 7 (stable) owns the schema, migrations, and typed client.
- The connection URL lives in `prisma.config.ts`. Runtime queries go through the `pg` driver adapter with a pool of 20.
- Migrations use the direct database URL. A pooler is for application traffic only.
- Money is `bigint` paisa. Percent discounts are basis points. Application code parses decimal strings and never uses binary floats.
- Primary keys are PostgreSQL `uuidv7()`. Public order numbers come from a separate sequence (`BL-250001`).
- Sessions stay in Redis. They are not a Postgres table.
- Full-text search is a `tsvector` maintained by a trigger, plus a trigram index on product name. Partial indexes for published listings are raw SQL, because Prisma cannot express them.

## Consequences

- A generated client is required before typecheck. `pnpm db:generate` does that.
- Schema changes ship as expand/migrate/contract migrations. The integrity migration (checks, search, order numbers) sits beside the generated tables.
- Swapping a payment or courier provider does not require a schema change. Those integrations sit behind adapter tables (`payments`, `shipments`) that already store the provider name.
