import { formatPromoLabel } from '../admin/promoRegistry.js';
import { validatePromoViaApi } from '../lib/promoApi.js';
import { isSupabaseConfigured } from '../lib/supabase.js';

/** @typedef {{ code: string, type: 'percent' | 'fixed', value: number, label: string, minSubtotal?: number, maxUses?: number, expiresAt?: string }} Promo */

/**
 * @param {string} code
 * @param {number} subtotal
 * @returns {Promise<{ ok: true, promo: Promo } | { ok: false, error: string }>}
 */
export async function validatePromo(code, subtotal) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Промокоды недоступны без Supabase' };
  }

  const result = await validatePromoViaApi(code, subtotal);
  if (!result.ok) return result;

  const promo = result.promo;
  return {
    ok: true,
    promo: {
      code: promo.code,
      type: promo.type,
      value: promo.value,
      label: promo.label || formatPromoLabel(promo),
      minSubtotal: promo.minSubtotal ?? undefined,
      maxUses: promo.maxUses ?? undefined,
      expiresAt: promo.expiresAt ?? undefined,
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
