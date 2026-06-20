import { getTelegramInitData, waitForTelegramInitData } from './telegramInitData.js';

export async function fetchMyOrders() {
  const initData = getTelegramInitData() || await waitForTelegramInitData();
  if (!initData) {
    return [];
  }

  const res = await fetch('/api/my-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Не удалось загрузить историю заказов');
  }

  return payload.orders ?? [];
}
