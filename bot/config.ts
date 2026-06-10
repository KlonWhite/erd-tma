import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

export const BOT_TOKEN = process.env.BOT_TOKEN?.trim() || '';
export const WEBAPP_URL = (process.env.WEBAPP_URL || process.env.VITE_WEBAPP_URL || '')
  .trim()
  .replace(/\/$/, '');
export const ADMIN_URL = `${WEBAPP_URL}/#/admin`;

export const ADMIN_TELEGRAM_IDS = (process.env.ADMIN_TELEGRAM_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)
  .map(Number)
  .filter((n) => Number.isFinite(n));

export function assertConfig(): void {
  required('BOT_TOKEN');
  required('WEBAPP_URL');
  required('SUPABASE_URL');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || process.env.SUPABASE_SECRET_KEY?.trim()
    || process.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
  }
}
