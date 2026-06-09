import { createClient } from '@supabase/supabase-js';

/** Env из Vercel / .env; fallback — публичные ключи проекта (anon/publishable). */
const url = (
  import.meta.env.VITE_SUPABASE_URL
  || 'https://dbiirtdoqfekecbrcbdy.supabase.co'
).trim();

const anonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY
  || 'sb_publishable_T8vNqxdqODKRySRMGd8BXg_S0dTrVoo'
).trim();

let client;

export function getSupabase() {
  if (!url || !anonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  }
  if (!client) {
    client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export function isSupabaseConfigured() {
  return Boolean(url && anonKey);
}
