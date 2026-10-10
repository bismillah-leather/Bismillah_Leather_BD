-- Applied as the second migration. Safe to re-read; statements are idempotent
-- where PostgreSQL allows it. pg_stat_statements is optional because it needs
-- shared_preload_libraries, which is set on the local Postgres container.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_stat_statements skipped: %', SQLERRM;
END $$;

CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 250001;

CREATE OR REPLACE FUNCTION next_order_number()
RETURNS text
LANGUAGE sql
AS $$
  SELECT 'BL-' || nextval('order_number_seq')::text;
$$;

CREATE OR REPLACE FUNCTION immutable_unaccent(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$
  SELECT public.unaccent('public.unaccent', input);
$$;

CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(NEW.slug, ''))), 'A') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(NEW.description, ''))), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_search_vector_trg ON products;
CREATE TRIGGER products_search_vector_trg
BEFORE INSERT OR UPDATE OF name, slug, description
ON products
FOR EACH ROW
EXECUTE FUNCTION products_search_vector_update();

CREATE INDEX IF NOT EXISTS products_search_vector_idx ON products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS products_published_listing_idx
  ON products (primary_category_id, published_at DESC, id)
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS categories_root_slug_idx
  ON categories (slug)
  WHERE parent_id IS NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS categories_child_slug_idx
  ON categories (parent_id, slug)
  WHERE parent_id IS NOT NULL AND deleted_at IS NULL;

ALTER TABLE product_variants
  DROP CONSTRAINT IF EXISTS product_variants_stock_nonnegative;
ALTER TABLE product_variants
  ADD CONSTRAINT product_variants_stock_nonnegative
  CHECK (stock_on_hand >= 0 AND stock_reserved >= 0 AND stock_reserved <= stock_on_hand);

ALTER TABLE order_items
  DROP CONSTRAINT IF EXISTS order_items_qty_positive;
ALTER TABLE order_items
  ADD CONSTRAINT order_items_qty_positive CHECK (qty > 0);

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_money_nonnegative;
ALTER TABLE orders
  ADD CONSTRAINT orders_money_nonnegative
  CHECK (subtotal >= 0 AND discount_total >= 0 AND delivery_fee >= 0 AND total >= 0);

ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_rating_range;
ALTER TABLE reviews
  ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE cart_items
  DROP CONSTRAINT IF EXISTS cart_items_qty_positive;
ALTER TABLE cart_items
  ADD CONSTRAINT cart_items_qty_positive CHECK (qty > 0);

ALTER TABLE stock_reservations
  DROP CONSTRAINT IF EXISTS stock_reservations_qty_positive;
ALTER TABLE stock_reservations
  ADD CONSTRAINT stock_reservations_qty_positive CHECK (qty > 0);
