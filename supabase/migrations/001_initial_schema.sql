-- ERD TMA — initial Supabase schema (PostgreSQL)

-- ── Clients (Telegram users) ─────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  roles JSONB NOT NULL DEFAULT '["client"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_telegram_id ON clients (telegram_id);

-- ── Catalog ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  collection TEXT,
  season TEXT,
  category TEXT,
  category_id TEXT REFERENCES categories (id) ON DELETE SET NULL,
  archive_tag TEXT,
  photo_id INTEGER,
  photo_kind TEXT,
  sizes JSONB NOT NULL DEFAULT '[]'::jsonb,
  sold_sizes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edition TEXT,
  description TEXT NOT NULL DEFAULT '',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  stock_by_size JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);

-- ── Promos ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promos (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
  value NUMERIC NOT NULL DEFAULT 0,
  label TEXT NOT NULL DEFAULT '',
  min_subtotal NUMERIC,
  max_uses INTEGER,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promo_usage (
  code TEXT PRIMARY KEY REFERENCES promos (code) ON DELETE CASCADE,
  usage_count INTEGER NOT NULL DEFAULT 0
);

-- ── Orders ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  client_telegram_id BIGINT,
  client_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  shipping TEXT,
  address TEXT,
  coords JSONB,
  subtotal NUMERIC,
  discount NUMERIC DEFAULT 0,
  shipping_cost NUMERIC DEFAULT 0,
  total NUMERIC,
  currency TEXT DEFAULT 'RUB',
  promo_code TEXT,
  items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  payment TEXT,
  payment_detail JSONB,
  customer JSONB,
  delivery JSONB,
  shipping_detail JSONB,
  notifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  assigned_admin_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_client_telegram_id ON orders (client_telegram_id);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_admin_id ON orders (assigned_admin_id);

-- ── Support ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_dialogues (
  id BIGSERIAL PRIMARY KEY,
  client_telegram_id BIGINT NOT NULL,
  client_name TEXT,
  client_username TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_dialogues_client ON support_dialogues (client_telegram_id, status);

CREATE TABLE IF NOT EXISTS support_messages (
  id BIGSERIAL PRIMARY KEY,
  dialogue_id BIGINT NOT NULL REFERENCES support_dialogues (id) ON DELETE CASCADE,
  from_role TEXT NOT NULL CHECK (from_role IN ('client', 'admin')),
  from_telegram_id BIGINT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_dialogue ON support_messages (dialogue_id);

-- ── updated_at triggers ───────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY['clients', 'categories', 'products', 'promos', 'orders', 'support_dialogues'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- ── RLS (anon key from Mini App; service role bypasses) ───
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_dialogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_categories" ON categories FOR SELECT USING (true);
CREATE POLICY "public_write_categories" ON categories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public_read_products" ON products FOR SELECT USING (true);
CREATE POLICY "public_write_products" ON products FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public_read_promos" ON promos FOR SELECT USING (true);
CREATE POLICY "public_write_promos" ON promos FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public_read_promo_usage" ON promo_usage FOR SELECT USING (true);
CREATE POLICY "public_write_promo_usage" ON promo_usage FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public_read_orders" ON orders FOR SELECT USING (true);
CREATE POLICY "public_write_orders" ON orders FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public_read_clients" ON clients FOR SELECT USING (true);
CREATE POLICY "public_write_clients" ON clients FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public_read_support_dialogues" ON support_dialogues FOR SELECT USING (true);
CREATE POLICY "public_write_support_dialogues" ON support_dialogues FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public_read_support_messages" ON support_messages FOR SELECT USING (true);
CREATE POLICY "public_write_support_messages" ON support_messages FOR ALL USING (true) WITH CHECK (true);

-- Обновить кэш PostgREST после создания таблиц
NOTIFY pgrst, 'reload schema';
