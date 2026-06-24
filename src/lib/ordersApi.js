import { getTelegramIdentity } from './telegramIdentity.js';

/** Создание заказа через серверный API (валидация цен, стока, промо). */
export async function createOrderViaApi(order) {
  const identity = await getTelegramIdentity();
  if (!identity.initData && !identity.fallbackUser) {
    throw new Error('Откройте магазин из Telegram для оформления заказа');
  }

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...identity, order }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Не удалось оформить заказ');
  }

  return data.order;
}
