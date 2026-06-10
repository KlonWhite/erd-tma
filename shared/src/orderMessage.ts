import type { DbOrder } from './types.js';

const SHIPPING_LABELS: Record<string, string> = {
  pickup: '🍽️ Самовывоз',
  courier: '🚚 Доставка',
  postal: '📮 Почта',
};

function formatMoney(amount: number | null | undefined, currency = 'RUB'): string {
  const n = Number(amount) || 0;
  const suffix = currency === 'RUB' ? '₽' : currency;
  return `${n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${suffix}`;
}

function parseItems(itemsJson: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(itemsJson)) return itemsJson;
  try {
    return JSON.parse(String(itemsJson ?? '[]'));
  } catch {
    return [];
  }
}

function formatAddress(order: Pick<DbOrder, 'address' | 'shipping'>): string {
  const addr = (order.address || '').trim();
  if (addr) return addr;
  if (order.shipping === 'pickup') return 'Самовывоз · showroom ERD';
  return '—';
}

function formatItemsBlock(items: Array<Record<string, unknown>>): string {
  if (!items.length) return '—';
  return items
    .map((i) => {
      const name = (i.name as string) || (i.productId as string) || 'Товар';
      const size = i.size ? ` (${i.size})` : '';
      const qty = i.qty ?? 1;
      return `${name}${size} x${qty}`;
    })
    .join('\n');
}

export function buildPendingOrderCard(order: DbOrder): string {
  const items = parseItems(order.items_json);
  const shippingLabel = SHIPPING_LABELS[order.shipping ?? ''] ?? order.shipping;

  return [
    `🆕 <b>Новый заказ ${order.public_id ?? `#${order.id}`}</b>`,
    '',
    `📍 <b>Адрес:</b> ${formatAddress(order)}`,
    `💰 <b>Сумма:</b> ${formatMoney(order.total, order.currency ?? 'RUB')}`,
    `📦 <b>Тип:</b> ${shippingLabel}`,
    '🍽️ <b>Товары:</b>',
    formatItemsBlock(items),
  ].join('\n');
}

export function buildCustomerOrderConfirmation(order: Pick<DbOrder, 'public_id'>): string {
  return `✅ Заказ <b>${order.public_id}</b> принят.\nМы свяжемся с вами в ближайшее время.`;
}

export { wasOrderNotified } from './orders.js';
