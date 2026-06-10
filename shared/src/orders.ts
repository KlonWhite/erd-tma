import type { SupabaseClient } from '@supabase/supabase-js';
import { getShippingOption } from './shipping.js';
import type { CreateOrderPayload, DbOrder, TelegramUser } from './types.js';

function mapRpcError(message: string): string {
  return message
    .replace(/^ERROR:\s*/i, '')
    .replace(/\s*CONTEXT:.*$/s, '')
    .trim();
}

/** Собирает JSON для RPC create_order (вся запись — одна транзакция в PostgreSQL). */
function buildOrderRpcPayload(
  payload: CreateOrderPayload,
  tgUser: TelegramUser | null,
) {
  const shippingOption = getShippingOption(payload.shipping);

  return {
    orderId: payload.orderId,
    items: (payload.items ?? [])
      .filter((i) => i.productId && i.qty > 0)
      .map((i) => ({
        productId: i.productId,
        size: i.size,
        qty: i.qty,
      })),
    shipping: shippingOption.id,
    promoCode: payload.promoCode ?? null,
    address: payload.address ?? null,
    coords: payload.coords ?? null,
    customer: payload.customer ?? null,
    delivery: payload.delivery ?? null,
    payment: payload.payment ?? 'demo',
    paymentDetail: payload.paymentDetail ?? null,
    clientTelegramId: tgUser?.id ?? payload.customer?.telegramId ?? null,
    clientName: payload.customer?.fullName ?? tgUser?.first_name ?? null,
  };
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

  const p_payload = buildOrderRpcPayload(payload, tgUser);

  const { data, error } = await supabase.rpc('create_order', { p_payload });

  if (error) {
    throw new Error(mapRpcError(error.message ?? 'Не удалось создать заказ'));
  }

  if (!data) {
    throw new Error('Не удалось создать заказ');
  }

  return data as DbOrder;
}

export function wasOrderNotified(order: Pick<DbOrder, 'notifications'>): boolean {
  return (order.notifications ?? []).some((n) => n.event === 'order_created');
}
