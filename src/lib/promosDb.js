import { getSupabase } from './supabase.js';
import { DEFAULT_PROMOS } from '../admin/defaultPromos.js';

function mapPromo(row) {
  return {
    id: row.id,
    code: row.code,
    type: row.type === 'fixed' ? 'fixed' : 'percent',
    value: Number(row.value) || 0,
    label: row.label || '',
    minSubtotal: row.min_subtotal != null ? Number(row.min_subtotal) : null,
    maxUses: row.max_uses != null ? Number(row.max_uses) : null,
    expiresAt: row.expires_at ?? null,
    active: row.active !== false,
  };
}

function promoToRow(promo) {
  return {
    id: promo.id,
    code: promo.code,
    type: promo.type === 'fixed' ? 'fixed' : 'percent',
    value: promo.value ?? 0,
    label: promo.label ?? '',
    min_subtotal: promo.minSubtotal ?? null,
    max_uses: promo.maxUses ?? null,
    expires_at: promo.expiresAt || null,
    active: promo.active !== false,
  };
}

export async function fetchPromos() {
  const { data, error } = await getSupabase()
    .from('promos')
    .select('*')
    .order('code');

  if (error) throw error;
  return (data ?? []).map(mapPromo);
}

export async function upsertPromo(promo) {
  const { data, error } = await getSupabase()
    .from('promos')
    .upsert(promoToRow(promo), { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw error;
  return mapPromo(data);
}

export async function deletePromo(id) {
  const { error } = await getSupabase().from('promos').delete().eq('id', id);
  if (error) throw error;
}

export async function getPromoUsageCount(code) {
  const key = String(code).trim().toUpperCase();
  const { data, error } = await getSupabase()
    .from('promo_usage')
    .select('usage_count')
    .eq('code', key)
    .maybeSingle();

  if (error) throw error;
  return data?.usage_count ?? 0;
}

export async function incrementPromoUsage(code) {
  const key = String(code).trim().toUpperCase();
  if (!key) return;

  const current = await getPromoUsageCount(key);
  const { error } = await getSupabase()
    .from('promo_usage')
    .upsert({ code: key, usage_count: current + 1 }, { onConflict: 'code' });

  if (error) throw error;
}

export async function seedDefaultPromosIfEmpty() {
  const existing = await fetchPromos();
  if (existing.length) return existing;

  for (const promo of DEFAULT_PROMOS) {
    await upsertPromo(promo);
  }
  return fetchPromos();
}
