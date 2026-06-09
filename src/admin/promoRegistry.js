import useAdminStore from './adminStore.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import {
  getPromoUsageCount as getPromoUsageCountDb,
  incrementPromoUsage as incrementPromoUsageDb,
} from '../lib/promosDb.js';
import { DEFAULT_PROMOS } from './defaultPromos.js';

export { DEFAULT_PROMOS };

function normalizePromoRecord(p) {
  return {
    id: p.id,
    code: String(p.code || '').trim().toUpperCase(),
    type: p.type === 'fixed' ? 'fixed' : 'percent',
    value: Number(p.value) || 0,
    label: p.label || formatPromoLabel(p),
    minSubtotal: p.minSubtotal ?? null,
    maxUses: p.maxUses != null && p.maxUses !== '' ? Number(p.maxUses) : null,
    expiresAt: p.expiresAt || null,
    active: p.active !== false,
  };
}

export function loadPromos() {
  const { promos, initialized } = useAdminStore.getState();
  if (initialized && promos.length) {
    return promos.map(normalizePromoRecord);
  }
  return DEFAULT_PROMOS.map(p => normalizePromoRecord({ ...p }));
}

export function savePromos(promos) {
  useAdminStore.setState({ promos: promos.map(normalizePromoRecord) });
}

export async function getPromoUsageCount(code) {
  if (isSupabaseConfigured()) {
    return getPromoUsageCountDb(code);
  }
  return 0;
}

export async function incrementPromoUsage(code) {
  if (isSupabaseConfigured()) {
    await incrementPromoUsageDb(code);
  }
}

export function isPromoExpired(expiresAt) {
  if (!expiresAt) return false;
  const end = String(expiresAt).length <= 10
    ? new Date(`${expiresAt}T23:59:59`)
    : new Date(expiresAt);
  return end.getTime() < Date.now();
}

export function findPromoRecord(code) {
  const key = code.trim().toUpperCase();
  if (!key) return null;
  return loadPromos().find(p => p.code === key) ?? null;
}

export function promosToMap(promos) {
  const map = {};
  for (const p of promos) {
    if (!p.active || isPromoExpired(p.expiresAt)) continue;
    map[p.code] = {
      type: p.type,
      value: Number(p.value) || 0,
      label: p.label || formatPromoLabel(p),
      minSubtotal: p.minSubtotal ?? undefined,
      maxUses: p.maxUses ?? undefined,
      expiresAt: p.expiresAt ?? undefined,
    };
  }
  return map;
}

export function formatPromoLabel(p) {
  if (p.type === 'percent') return `−${p.value}%`;
  return `−${Number(p.value).toLocaleString('ru-RU')} ₽`;
}

export function formatExpiresAt(expiresAt) {
  if (!expiresAt) return 'без срока';
  const d = new Date(expiresAt.length <= 10 ? `${expiresAt}T12:00:00` : expiresAt);
  return d.toLocaleDateString('ru-RU');
}

export function toDateInputValue(expiresAt) {
  if (!expiresAt) return '';
  if (String(expiresAt).length <= 10) return String(expiresAt);
  return new Date(expiresAt).toISOString().slice(0, 10);
}
