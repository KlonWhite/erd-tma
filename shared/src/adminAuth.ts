import type { SupabaseClient } from '@supabase/supabase-js';
import { parseAdminIds } from './supabase.js';
import type { TelegramUser } from './types.js';

function parseRoles(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  try {
    const roles = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(roles) ? roles.map(String) : ['client'];
  } catch {
    return ['client'];
  }
}

export async function isTelegramAdmin(
  supabase: SupabaseClient,
  user: TelegramUser,
): Promise<boolean> {
  if (parseAdminIds().includes(user.id)) return true;

  const { data, error } = await supabase
    .from('clients')
    .select('roles')
    .eq('telegram_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return parseRoles(data?.roles).includes('admin');
}

export async function requireTelegramAdmin(
  supabase: SupabaseClient,
  user: TelegramUser | null,
): Promise<TelegramUser> {
  if (!user?.id) {
    throw new Error('Invalid Telegram initData');
  }

  const ok = await isTelegramAdmin(supabase, user);
  if (!ok) {
    throw new Error('Admin access required');
  }

  return user;
}
