import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function getSupabaseUrl(): string {
  return (
    process.env.SUPABASE_URL?.trim()
    || process.env.VITE_SUPABASE_URL?.trim()
    || ''
  );
}

export function getServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || process.env.SUPABASE_SECRET_KEY?.trim()
    || ''
  );
}

export function getServerSupabase(): SupabaseClient {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();

  if (!url || !key) {
    throw new Error('Supabase service role is not configured on server');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function parseAdminIds(): number[] {
  return (process.env.ADMIN_TELEGRAM_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}
