import { getTelegramIdentity } from './telegramIdentity.js';

export async function fetchProfile() {
  const identity = await getTelegramIdentity();
  if (!identity.initData && !identity.fallbackUser) {
    return null;
  }

  const res = await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(identity),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Не удалось загрузить профиль');
  }

  return payload;
}

export async function fetchMyOrders() {
  const identity = await getTelegramIdentity();
  if (!identity.initData && !identity.fallbackUser) {
    return [];
  }

  const res = await fetch('/api/my-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(identity),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Не удалось загрузить историю заказов');
  }

  return payload.orders ?? [];
}
