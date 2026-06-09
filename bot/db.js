import { ADMIN_TELEGRAM_IDS } from './config.js';
import { getSupabase } from './supabaseClient.js';

function parseRoles(raw) {
  if (Array.isArray(raw)) return raw.map(String);
  try {
    const roles = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(roles) ? roles.map(String) : ['client'];
  } catch {
    return ['client'];
  }
}

function serializeRoles(roles) {
  const unique = [...new Set(roles.map(String))];
  if (!unique.includes('client')) unique.unshift('client');
  return unique;
}

function withAdminRole(telegramId, roles) {
  const next = new Set(roles);
  next.add('client');
  if (ADMIN_TELEGRAM_IDS.includes(Number(telegramId))) {
    next.add('admin');
  }
  return [...next];
}

function mapClient(row) {
  if (!row) return null;
  return {
    id: row.id,
    telegram_id: row.telegram_id,
    username: row.username,
    first_name: row.first_name,
    roles: parseRoles(row.roles),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function findClientByTelegramId(telegramId) {
  const { data, error } = await getSupabase()
    .from('clients')
    .select('id, telegram_id, username, first_name, roles, created_at, updated_at')
    .eq('telegram_id', telegramId)
    .maybeSingle();

  if (error) throw error;
  return mapClient(data);
}

export async function upsertClientFromMessage(from) {
  const telegramId = from.id;
  const username = from.username ?? null;
  const firstName = from.first_name ?? null;

  const existing = await findClientByTelegramId(telegramId);
  const roles = serializeRoles(withAdminRole(telegramId, existing?.roles ?? ['client']));

  const { error } = await getSupabase()
    .from('clients')
    .upsert(
      {
        telegram_id: telegramId,
        username,
        first_name: firstName,
        roles,
      },
      { onConflict: 'telegram_id' },
    );

  if (error) throw error;

  return {
    client: await findClientByTelegramId(telegramId),
    isNew: !existing,
  };
}

export function isAdmin(client) {
  return client?.roles?.includes('admin');
}

/** Telegram IDs всех админов (из env + роль admin в БД). */
export async function getAdminTelegramIds() {
  const ids = new Set(ADMIN_TELEGRAM_IDS);

  const { data, error } = await getSupabase()
    .from('clients')
    .select('telegram_id')
    .contains('roles', ['admin']);

  if (error) throw error;

  for (const row of data ?? []) {
    ids.add(Number(row.telegram_id));
  }

  return [...ids].filter(n => Number.isFinite(n));
}
