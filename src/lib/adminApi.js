import tg from '../tg.js';

function getInitData() {
  const initData = tg.app?.initData;
  if (!initData) {
    throw new Error('Откройте админ-панель из Telegram');
  }
  return initData;
}

async function adminRequest(action, data = {}) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, initData: getInitData(), data }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || `Admin API error (${res.status})`);
  }
  return payload;
}

export async function verifyAdminAccess() {
  const initData = tg.app?.initData;
  if (!initData) {
    return { ok: false, isAdmin: false, error: 'Нет Telegram initData' };
  }

  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'verify', initData }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, isAdmin: false, error: payload.error || 'Ошибка проверки' };
  }

  return {
    ok: true,
    isAdmin: Boolean(payload.isAdmin),
    user: payload.user,
  };
}

export function adminBootstrap() {
  return adminRequest('bootstrap');
}

export function adminUpdateOrder(orderId, patch) {
  return adminRequest('updateOrder', { orderId, patch });
}

export function adminUpsertProduct(product) {
  return adminRequest('upsertProduct', { product });
}

export function adminDeleteProduct(id) {
  return adminRequest('deleteProduct', { id });
}

export function adminUpsertCategory(category) {
  return adminRequest('upsertCategory', { category });
}

export function adminDeleteCategory(id) {
  return adminRequest('deleteCategory', { id });
}

export function adminUpsertPromo(promo) {
  return adminRequest('upsertPromo', { promo });
}

export function adminDeletePromo(id) {
  return adminRequest('deletePromo', { id });
}

export async function adminUploadImage(file, productId) {
  const base64 = await fileToBase64(file);
  const result = await adminRequest('uploadImage', {
    productId,
    fileName: file.name,
    contentType: file.type || 'image/jpeg',
    base64,
  });
  return result.url;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || '');
      const comma = raw.indexOf(',');
      resolve(comma >= 0 ? raw.slice(comma + 1) : raw);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
