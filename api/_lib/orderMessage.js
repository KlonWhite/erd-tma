const SHIPPING_LABELS = {
  pickup: '🍽️ Самовывоз',
  courier: '🚚 Доставка',
  postal: '📮 Почта',
};

function formatMoney(amount, currency = 'RUB') {
  const n = Number(amount) || 0;
  const suffix = currency === 'RUB' ? '₽' : currency;
  return `${n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${suffix}`;
}

function parseItems(itemsJson) {
  if (Array.isArray(itemsJson)) return itemsJson;
  try {
    return JSON.parse(itemsJson ?? '[]');
  } catch {
    return [];
  }
}

function formatAddress(order) {
  const addr = (order.address || '').trim();
  if (addr) return addr;
  if (order.shipping === 'pickup') return 'Самовывоз · showroom ERD';
  return '—';
}

function formatItemsBlock(items) {
  if (!items.length) return '—';
  return items
    .map((i) => {
      const name = i.name || i.productId || 'Товар';
      const size = i.size ? ` (${i.size})` : '';
      const qty = i.qty ?? 1;
      return `${name}${size} x${qty}`;
    })
    .join('\n');
}

export function buildPendingOrderCard(order) {
  const items = parseItems(order.items_json);
  const shippingLabel = SHIPPING_LABELS[order.shipping] ?? order.shipping;

  return [
    `🆕 <b>Новый заказ ${order.public_id ?? `#${order.id}`}</b>`,
    '',
    `📍 <b>Адрес:</b> ${formatAddress(order)}`,
    `💰 <b>Сумма:</b> ${formatMoney(order.total, order.currency)}`,
    `📦 <b>Тип:</b> ${shippingLabel}`,
    '🍽️ <b>Товары:</b>',
    formatItemsBlock(items),
  ].join('\n');
}

export function buildCustomerOrderConfirmation(order) {
  return `✅ Заказ <b>${order.public_id}</b> принят.\nМы свяжемся с вами в ближайшее время.`;
}

export function wasOrderNotified(order) {
  return (order.notifications ?? []).some((n) => n.event === 'order_created');
}
