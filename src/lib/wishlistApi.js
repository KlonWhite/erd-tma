import { getTelegramInitData, waitForTelegramInitData } from './telegramInitData.js';

async function wishlistRequest(action, data = {}) {
  const initData = getTelegramInitData() || await waitForTelegramInitData();
  if (!initData) {
    return null;
  }

  const res = await fetch('/api/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, initData, ...data }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Не удалось синхронизировать избранное');
  }

  return payload.wishlist ?? [];
}

export function fetchWishlist() {
  return wishlistRequest('list');
}

export function syncWishlist(productIds) {
  return wishlistRequest('sync', { productIds });
}

export function toggleWishlistRemote(productId) {
  return wishlistRequest('toggle', { productId });
}
