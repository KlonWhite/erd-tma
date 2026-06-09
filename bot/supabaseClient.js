import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

export function getSupabaseKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || process.env.SUPABASE_SECRET_KEY?.trim()
    || process.env.VITE_SUPABASE_ANON_KEY?.trim()
    || ''
  );
}

let client;

export function getSupabase() {
  if (!client) {
    const key = getSupabaseKey();
    if (!key) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
    }
    client = createClient(
      required('SUPABASE_URL'),
      key,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: { transport: ws },
      },
    );
  }
  return client;
}

export function assertSupabaseConfig() {
  required('SUPABASE_URL');
  if (!getSupabaseKey()) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
  }
}
