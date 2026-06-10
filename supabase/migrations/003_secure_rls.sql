-- Закрытие открытых RLS-политик + серверные RPC

-- ── Удалить permissive write-политики ─────────────────────
DROP POLICY IF EXISTS "public_write_categories" ON categories;
DROP POLICY IF EXISTS "public_write_products" ON products;
DROP POLICY IF EXISTS "public_write_promos" ON promos;
DROP POLICY IF EXISTS "public_write_promo_usage" ON promo_usage;
DROP POLICY IF EXISTS "public_write_orders" ON orders;
DROP POLICY IF EXISTS "public_write_clients" ON clients;
DROP POLICY IF EXISTS "public_write_support_dialogues" ON support_dialogues;
DROP POLICY IF EXISTS "public_write_support_messages" ON support_messages;

-- ── Ужесточить read-политики ──────────────────────────────
DROP POLICY IF EXISTS "public_read_promos" ON promos;
CREATE POLICY "anon_read_active_promos" ON promos
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "public_read_promo_usage" ON promo_usage;
-- promo_usage: только service role (без anon-политик)

DROP POLICY IF EXISTS "public_read_orders" ON orders;
-- orders: только service role

DROP POLICY IF EXISTS "public_read_clients" ON clients;
-- clients: только service role

DROP POLICY IF EXISTS "public_read_support_dialogues" ON support_dialogues;
DROP POLICY IF EXISTS "public_read_support_messages" ON support_messages;
-- support: только service role

-- categories + products: anon SELECT (каталог в Mini App)
-- public_read_categories / public_read_products остаются

-- ── Storage: только чтение для anon ───────────────────────
DROP POLICY IF EXISTS "product_images_public_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_public_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_public_delete" ON storage.objects;

-- ── Атомарный инкремент промокода ─────────────────────────
CREATE OR REPLACE FUNCTION increment_promo_usage(p_code TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO promo_usage (code, usage_count)
  VALUES (upper(trim(p_code)), 1)
  ON CONFLICT (code) DO UPDATE
    SET usage_count = promo_usage.usage_count + 1;
END;
$$;

REVOKE ALL ON FUNCTION increment_promo_usage(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_promo_usage(TEXT) TO service_role;

NOTIFY pgrst, 'reload schema';
