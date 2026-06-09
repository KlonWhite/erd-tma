import {
  findPromoRecord,
  formatPromoLabel,
  getPromoUsageCount,
  incrementPromoUsage,
  isPromoExpired,
  loadPromos,
  promosToMap,
} from '../admin/promoRegistry.js';

export { incrementPromoUsage };

/** @typedef {{ code: string, type: 'percent' | 'fixed', value: number, label: string, minSubtotal?: number, maxUses?: number, expiresAt?: string }} Promo */

export function getPromoCodesMap() {
  return promosToMap(loadPromos());
}

/**
 * @param {string} code
 * @param {number} subtotal
 * @returns {Promise<{ ok: true, promo: Promo } | { ok: false, error: string }>}
 */
export async function validatePromo(code, subtotal) {
  const key = code.trim().toUpperCase();
  if (!key) return { ok: false, error: 'Введите промокод' };

  const record = findPromoRecord(key);
  if (!record) return { ok: false, error: 'Промокод не найден' };
  if (!record.active) return { ok: false, error: 'Промокод недоступен' };

  if (isPromoExpired(record.expiresAt)) {
    return { ok: false, error: 'Срок действия промокода истёк' };
  }

  const used = await getPromoUsageCount(key);
  if (record.maxUses != null && used >= record.maxUses) {
    return { ok: false, error: 'Лимит использований исчерпан' };
  }

  const raw = promosToMap(loadPromos())[key];
  if (!raw) {
    return { ok: false, error: 'Промокод недоступен' };
  }

  if (raw.minSubtotal != null && subtotal < raw.minSubtotal) {
    return {
      ok: false,
      error: `Минимальная сумма заказа ${raw.minSubtotal.toLocaleString('ru-RU')} ₽`,
    };
  }

  return {
    ok: true,
    promo: {
      code: key,
      type: record.type,
      value: record.value,
      label: record.label || formatPromoLabel(record),
      minSubtotal: record.minSubtotal ?? undefined,
      maxUses: record.maxUses ?? undefined,
      expiresAt: record.expiresAt ?? undefined,
    },
  };
}

/** @param {number} subtotal @param {Promo | null} promo */
export function calcPromoDiscount(subtotal, promo) {
  if (!promo || subtotal <= 0) return 0;
  if (promo.type === 'percent') {
    return Math.round(subtotal * promo.value / 100);
  }
  if (promo.type === 'fixed') {
    return Math.min(subtotal, promo.value);
  }
  return 0;
}
