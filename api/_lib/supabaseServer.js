import { createClient } from '@supabase/supabase-js';

export function getServerSupabase() {
  const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || process.env.VITE_SUPABASE_ANON_KEY?.trim()
    || ''
  );

  if (!url || !key) {
    throw new Error('Supabase is not configured on server');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
