ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_new" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "products_is_new_status_idx" ON "products" ("is_new", "status");
