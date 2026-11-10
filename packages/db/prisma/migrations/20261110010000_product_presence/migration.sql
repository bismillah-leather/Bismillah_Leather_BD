CREATE TABLE IF NOT EXISTS "product_presence" (
    "slug" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_presence_pkey" PRIMARY KEY ("slug", "visitor_id")
);

CREATE INDEX IF NOT EXISTS "product_presence_seen_idx" ON "product_presence" ("seen_at");
