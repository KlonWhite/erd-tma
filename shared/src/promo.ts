import type { SupabaseClient } from '@supabase/supabase-js';
import type { PromoRecord } from './types.js';

export function isPromoExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

export function calcPromoDiscount(
  subtotal: number,
  promo: Pick<PromoRecord, 'type' | 'value'>,
): number {
  if (subtotal <= 0) return 0;
  if (promo.type === 'percent') {
    return Math.round(subtotal * promo.value / 100);
  }
  if (promo.type === 'fixed') {
    return Math.min(subtotal, promo.value);
  }
  return 0;
}

export async function getPromoUsageCount(
  supabase: SupabaseClient,
  code: string,
): Promise<number> {
  const key = code.trim().toUpperCase();
  const { data, error } = await supabase
    .from('promo_usage')
    .select('usage_count')
    .eq('code', key)
    .maybeSingle();

  if (error) throw error;
  return data?.usage_count ?? 0;
}

export async function validatePromoCode(
  supabase: SupabaseClient,
  code: string,
  subtotal: number,
): Promise<{ ok: true; promo: PromoRecord; discount: number } | { ok: false; error: string }> {
  const key = code.trim().toUpperCase();
  if (!key) return { ok: false, error: 'Введите промокод' };

  const { data, error } = await supabase
    .from('promos')
    .select('*')
    .eq('code', key)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { ok: false, error: 'Промокод не найден' };

  const promo = data as PromoRecord;
  if (!promo.active) return { ok: false, error: 'Промокод недоступен' };
  if (isPromoExpired(promo.expires_at)) {
    return { ok: false, error: 'Срок действия промокода истёк' };
  }

  const used = await getPromoUsageCount(supabase, key);
  if (promo.max_uses != null && used >= promo.max_uses) {
    return { ok: false, error: 'Лимит использований исчерпан' };
  }

  if (promo.min_subtotal != null && subtotal < Number(promo.min_subtotal)) {
    return {
      ok: false,
      error: `Минимальная сумма заказа ${Number(promo.min_subtotal).toLocaleString('ru-RU')} ₽`,
    };
  }

  const discount = calcPromoDiscount(subtotal, promo);
  return { ok: true, promo, discount };
}

export async function incrementPromoUsageRpc(
  supabase: SupabaseClient,
  code: string,
): Promise<void> {
  const key = code.trim().toUpperCase();
  if (!key) return;

  const { error } = await supabase.rpc('increment_promo_usage', { p_code: key });
  if (error) throw error;
}
