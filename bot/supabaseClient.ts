import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '../shared/dist/index.js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = getServerSupabase();
  }
  return client;
}

export function assertSupabaseConfig(): void {
  getSupabase();
}
