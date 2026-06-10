import type { SupabaseClient } from '@supabase/supabase-js';
import { getShippingOption } from './shipping.js';
import { incrementPromoUsageRpc, validatePromoCode } from './promo.js';
import type { CreateOrderPayload, DbOrder, DbProduct, TelegramUser } from './types.js';

function parseStock(stock: unknown): Record<string, number> {
  if (!stock || typeof stock !== 'object') return {};
  return stock as Record<string, number>;
}

export async function createOrderOnServer(
  supabase: SupabaseClient,
  payload: CreateOrderPayload,
  tgUser: TelegramUser | null,
): Promise<DbOrder> {
  const items = (payload.items ?? []).filter((i) => i.productId && i.qty > 0);
  if (!items.length) {
    throw new Error('Корзина пуста');
  }

  const productIds = [...new Set(items.map((i) => i.productId))];
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price, sizes, stock_by_size')
    .in('id', productIds);

  if (productsError) throw productsError;

  const productMap = new Map<string, DbProduct>();
  for (const row of products ?? []) {
    productMap.set(row.id, row as DbProduct);
  }

  let subtotal = 0;
  const orderItems: Array<{
    productId: string;
    name: string;
    size: string;
    qty: number;
    price: number;
  }> = [];
  const stockUpdates = new Map<string, Record<string, number>>();

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Товар не найден: ${item.productId}`);
    }

    const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
    const size = item.size || product.sizes?.[0] || 'ONE SIZE';
    const stock = parseStock(product.stock_by_size);
    const available = stock[size] ?? 0;

    if (available < qty) {
      throw new Error(`Недостаточно товара «${product.name}» (${size})`);
    }

    const price = Number(product.price) || 0;
    subtotal += price * qty;
    orderItems.push({
      productId: product.id,
      name: product.name,
      size,
      qty,
      price,
    });

    const nextStock = { ...stock, [size]: available - qty };
    stockUpdates.set(product.id, nextStock);
  }

  let discount = 0;
  let promoCode: string | null = null;

  if (payload.promoCode) {
    const promoResult = await validatePromoCode(supabase, payload.promoCode, subtotal);
    if (!promoResult.ok) {
      throw new Error(promoResult.error);
    }
    discount = promoResult.discount;
    promoCode = promoResult.promo.code;
  }

  const shippingOption = getShippingOption(payload.shipping);
  const shippingCost = shippingOption.price;
  const total = Math.max(0, subtotal - discount) + shippingCost;

  const publicId = payload.orderId || `#ERD-${Date.now().toString().slice(-5)}`;
  const address = payload.address?.trim()
    || payload.delivery?.address?.trim()
    || (shippingOption.needsAddress ? '' : shippingOption.pickupAddress ?? '');

  if (shippingOption.needsAddress && address.length < 5) {
    throw new Error('Укажите адрес доставки');
  }

  const row = {
    public_id: publicId,
    client_telegram_id: tgUser?.id ?? payload.customer?.telegramId ?? null,
    client_name: payload.customer?.fullName ?? tgUser?.first_name ?? null,
    status: 'pending',
    shipping: shippingOption.id,
    address,
    coords: payload.coords ?? null,
    subtotal,
    discount,
    shipping_cost: shippingCost,
    total,
    currency: 'RUB',
    promo_code: promoCode,
    items_json: orderItems,
    payment: payload.payment ?? 'demo',
    customer: payload.customer ?? null,
    delivery: payload.delivery ?? null,
    shipping_detail: {
      id: shippingOption.id,
      name: shippingOption.name,
      cost: shippingCost,
    },
    payment_detail: payload.paymentDetail ?? {
      id: payload.payment ?? 'demo',
      name: 'ДЕМО-ОПЛАТА',
      status: 'paid',
    },
    notifications: [] as Array<Record<string, unknown>>,
  };

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(row)
    .select('*')
    .single();

  if (orderError) throw orderError;

  for (const [productId, stockBySize] of stockUpdates) {
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock_by_size: stockBySize })
      .eq('id', productId);

    if (stockError) throw stockError;
  }

  if (promoCode) {
    await incrementPromoUsageRpc(supabase, promoCode);
  }

  return order as DbOrder;
}

export function wasOrderNotified(order: Pick<DbOrder, 'notifications'>): boolean {
  return (order.notifications ?? []).some((n) => n.event === 'order_created');
}
