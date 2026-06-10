-- Атомарное создание заказа: сток + промо + insert в одной транзакции

CREATE OR REPLACE FUNCTION create_order(p_payload JSONB)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items JSONB;
  v_item JSONB;
  v_product products%ROWTYPE;
  v_subtotal NUMERIC := 0;
  v_discount NUMERIC := 0;
  v_shipping_cost NUMERIC := 0;
  v_total NUMERIC := 0;
  v_promo_code TEXT;
  v_promo promos%ROWTYPE;
  v_usage_count INTEGER;
  v_order_items JSONB := '[]'::jsonb;
  v_size TEXT;
  v_qty INTEGER;
  v_price NUMERIC;
  v_available INTEGER;
  v_stock JSONB;
  v_shipping TEXT;
  v_address TEXT;
  v_public_id TEXT;
  v_order orders%ROWTYPE;
  v_needs_address BOOLEAN;
  v_pickup_address TEXT := 'МОСКВА, УЛ. ТВЕРСКАЯ, 15 · SHOWROOM ERD';
  v_shipping_name TEXT;
  v_line RECORD;
BEGIN
  v_items := p_payload->'items';
  IF v_items IS NULL OR jsonb_typeof(v_items) <> 'array' OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'Корзина пуста';
  END IF;

  CREATE TEMP TABLE _order_stock_updates (
    product_id TEXT PRIMARY KEY,
    stock_by_size JSONB NOT NULL
  ) ON COMMIT DROP;

  -- 1) Валидация позиций и расчёт subtotal
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items) AS t(value)
  LOOP
    IF COALESCE(v_item->>'productId', '') = '' THEN
      CONTINUE;
    END IF;

    SELECT * INTO v_product
    FROM products
    WHERE id = v_item->>'productId'
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Товар не найден: %', v_item->>'productId';
    END IF;

    v_qty := GREATEST(1, FLOOR(COALESCE((v_item->>'qty')::numeric, 1)));
    v_size := COALESCE(
      NULLIF(trim(v_item->>'size'), ''),
      v_product.sizes->>0,
      'ONE SIZE'
    );

    IF EXISTS (
      SELECT 1 FROM _order_stock_updates u WHERE u.product_id = v_product.id
    ) THEN
      SELECT stock_by_size INTO v_stock FROM _order_stock_updates WHERE product_id = v_product.id;
    ELSE
      v_stock := COALESCE(v_product.stock_by_size, '{}'::jsonb);
    END IF;

    v_available := COALESCE((v_stock->>v_size)::integer, 0);
    IF v_available < v_qty THEN
      RAISE EXCEPTION 'Недостаточно товара «%» (%)', v_product.name, v_size;
    END IF;

    v_price := COALESCE(v_product.price, 0);
    v_subtotal := v_subtotal + v_price * v_qty;

    v_order_items := v_order_items || jsonb_build_array(
      jsonb_build_object(
        'productId', v_product.id,
        'name', v_product.name,
        'size', v_size,
        'qty', v_qty,
        'price', v_price
      )
    );

    v_stock := jsonb_set(v_stock, ARRAY[v_size], to_jsonb(v_available - v_qty), true);

    INSERT INTO _order_stock_updates (product_id, stock_by_size)
    VALUES (v_product.id, v_stock)
    ON CONFLICT (product_id) DO UPDATE
      SET stock_by_size = EXCLUDED.stock_by_size;
  END LOOP;

  IF jsonb_array_length(v_order_items) = 0 THEN
    RAISE EXCEPTION 'Корзина пуста';
  END IF;

  -- 2) Промокод
  v_promo_code := NULLIF(upper(trim(COALESCE(p_payload->>'promoCode', ''))), '');
  IF v_promo_code IS NOT NULL THEN
    SELECT * INTO v_promo FROM promos WHERE code = v_promo_code;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Промокод не найден';
    END IF;
    IF NOT v_promo.active THEN
      RAISE EXCEPTION 'Промокод недоступен';
    END IF;
    IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
      RAISE EXCEPTION 'Срок действия промокода истёк';
    END IF;

    SELECT COALESCE(usage_count, 0) INTO v_usage_count
    FROM promo_usage
    WHERE code = v_promo_code;

    IF v_promo.max_uses IS NOT NULL AND COALESCE(v_usage_count, 0) >= v_promo.max_uses THEN
      RAISE EXCEPTION 'Лимит использований исчерпан';
    END IF;

    IF v_promo.min_subtotal IS NOT NULL AND v_subtotal < v_promo.min_subtotal THEN
      RAISE EXCEPTION 'Минимальная сумма заказа % ₽', v_promo.min_subtotal;
    END IF;

    v_discount := CASE v_promo.type
      WHEN 'percent' THEN round(v_subtotal * v_promo.value / 100)
      WHEN 'fixed' THEN LEAST(v_subtotal, v_promo.value)
      ELSE 0
    END;
  END IF;

  -- 3) Доставка и адрес
  v_shipping := COALESCE(NULLIF(p_payload->>'shipping', ''), 'pickup');
  v_shipping_cost := CASE v_shipping
    WHEN 'courier' THEN 790
    WHEN 'postal' THEN 490
    ELSE 0
  END;
  v_shipping_name := CASE v_shipping
    WHEN 'courier' THEN 'ДОСТАВКА'
    WHEN 'postal' THEN 'ПОЧТОВАЯ ДОСТАВКА'
    ELSE 'САМОВЫВОЗ'
  END;
  v_needs_address := v_shipping IN ('courier', 'postal');

  v_address := COALESCE(
    NULLIF(trim(COALESCE(p_payload->>'address', '')), ''),
    NULLIF(trim(COALESCE(p_payload->'delivery'->>'address', '')), ''),
    CASE WHEN v_needs_address THEN '' ELSE v_pickup_address END
  );

  IF v_needs_address AND length(v_address) < 5 THEN
    RAISE EXCEPTION 'Укажите адрес доставки';
  END IF;

  v_total := GREATEST(0, v_subtotal - v_discount) + v_shipping_cost;

  v_public_id := COALESCE(
    NULLIF(trim(COALESCE(p_payload->>'orderId', '')), ''),
    '#ERD-' || lpad((extract(epoch from clock_timestamp())::bigint % 100000)::text, 5, '0')
  );

  -- 4) Списание стока
  FOR v_line IN SELECT product_id, stock_by_size FROM _order_stock_updates
  LOOP
    UPDATE products
    SET stock_by_size = v_line.stock_by_size
    WHERE id = v_line.product_id;
  END LOOP;

  -- 5) Заказ
  INSERT INTO orders (
    public_id,
    client_telegram_id,
    client_name,
    status,
    shipping,
    address,
    coords,
    subtotal,
    discount,
    shipping_cost,
    total,
    currency,
    promo_code,
    items_json,
    payment,
    customer,
    delivery,
    shipping_detail,
    payment_detail,
    notifications
  ) VALUES (
    v_public_id,
    COALESCE((p_payload->>'clientTelegramId')::bigint, (p_payload->'customer'->>'telegramId')::bigint),
    COALESCE(p_payload->>'clientName', p_payload->'customer'->>'fullName'),
    'pending',
    v_shipping,
    v_address,
    p_payload->'coords',
    v_subtotal,
    v_discount,
    v_shipping_cost,
    v_total,
    'RUB',
    v_promo_code,
    v_order_items,
    COALESCE(NULLIF(p_payload->>'payment', ''), 'demo'),
    p_payload->'customer',
    p_payload->'delivery',
    jsonb_build_object(
      'id', v_shipping,
      'name', v_shipping_name,
      'cost', v_shipping_cost
    ),
    COALESCE(
      p_payload->'paymentDetail',
      jsonb_build_object(
        'id', COALESCE(NULLIF(p_payload->>'payment', ''), 'demo'),
        'name', 'ДЕМО-ОПЛАТА',
        'status', 'paid'
      )
    ),
    '[]'::jsonb
  )
  RETURNING * INTO v_order;

  -- 6) Промо usage
  IF v_promo_code IS NOT NULL THEN
    PERFORM increment_promo_usage(v_promo_code);
  END IF;

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION create_order(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_order(JSONB) TO service_role;

NOTIFY pgrst, 'reload schema';
