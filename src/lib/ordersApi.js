import { getTelegramInitData, waitForTelegramInitData } from './telegramInitData.js';

/** Создание заказа через серверный API (валидация цен, стока, промо). */
export async function createOrderViaApi(order) {
  const initData = getTelegramInitData() || await waitForTelegramInitData();
  if (!initData) {
    throw new Error('Откройте магазин из Telegram для оформления заказа');
  }

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData, order }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Не удалось оформить заказ');
  }

  return data.order;
}
