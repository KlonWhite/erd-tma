-- Wishlist: избранные товары пользователя Telegram

CREATE TABLE IF NOT EXISTS wishlists (
  id BIGSERIAL PRIMARY KEY,
  client_telegram_id BIGINT NOT NULL,
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_telegram_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_client ON wishlists (client_telegram_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishlists_product ON wishlists (product_id);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_wishlists" ON wishlists;
DROP POLICY IF EXISTS "public_write_wishlists" ON wishlists;
-- wishlists: только service role через Vercel API

NOTIFY pgrst, 'reload schema';
