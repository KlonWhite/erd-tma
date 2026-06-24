import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  validateTelegramInitData,
  type TelegramUser,
} from '../../shared/dist/index.js';
import { getBotToken } from './http.js';

const FALLBACK_MAX_AGE_SEC = 30 * 24 * 60 * 60;

interface TelegramIdentityBody {
  initData?: string;
  fallbackUser?: string;
  fallbackSignature?: string;
}

export interface ResolvedTelegramIdentity {
  user: TelegramUser;
  source: 'initData' | 'botKeyboard';
  verified: boolean;
}

function decodeBase64UrlJson(value: string): Record<string, unknown> | null {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function validateBotKeyboardPayload(
  fallbackUser: string | undefined,
  fallbackSignature: string | undefined,
  botToken: string,
): TelegramUser | null {
  if (!fallbackUser || !fallbackSignature || !botToken) return null;

  const expected = crypto
    .createHmac('sha256', botToken)
    .update(fallbackUser)
    .digest('hex');
  const actual = String(fallbackSignature);

  if (
    expected.length !== actual.length
    || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual))
  ) {
    return null;
  }

  const payload = decodeBase64UrlJson(fallbackUser);
  const id = Number(payload?.id);
  if (!Number.isFinite(id)) return null;

  const authDate = Number(payload?.auth_date);
  if (!authDate) return null;

  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > FALLBACK_MAX_AGE_SEC) return null;

  return {
    id,
    first_name: String(payload?.first_name ?? ''),
    username: payload?.username ? String(payload.username) : undefined,
  };
}

export function resolveTelegramIdentity(body: TelegramIdentityBody): ResolvedTelegramIdentity | null {
  const botToken = getBotToken();
  const initDataUser = body.initData
    ? validateTelegramInitData(body.initData, botToken)
    : null;

  if (initDataUser?.id) {
    return {
      user: initDataUser,
      source: 'initData',
      verified: true,
    };
  }

  const fallback = validateBotKeyboardPayload(
    body.fallbackUser,
    body.fallbackSignature,
    botToken,
  );

  if (!fallback?.id) return null;

  return {
    user: fallback,
    source: 'botKeyboard',
    verified: true,
  };
}

function rolesFromRaw(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed.map(String) : ['client'];
  } catch {
    return ['client'];
  }
}

export async function findClientProfile(
  supabase: SupabaseClient,
  telegramId: number,
) {
  const { data, error } = await supabase
    .from('clients')
    .select('id, telegram_id, username, first_name, roles, created_at, updated_at')
    .eq('telegram_id', telegramId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    telegramId: Number(data.telegram_id),
    username: data.username ?? '',
    firstName: data.first_name ?? '',
    roles: rolesFromRaw(data.roles),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function syncClientProfile(
  supabase: SupabaseClient,
  user: TelegramUser,
) {
  const existing = await findClientProfile(supabase, user.id);

  if (!existing) {
    const { error } = await supabase.from('clients').insert({
      telegram_id: user.id,
      username: user.username ?? null,
      first_name: user.first_name ?? null,
      roles: ['client'],
    });
    if (error) throw error;
    return findClientProfile(supabase, user.id);
  }

  const patch: Record<string, unknown> = {};
  if ((user.username ?? '') !== (existing.username ?? '')) {
    patch.username = user.username ?? null;
  }
  if ((user.first_name ?? '') !== (existing.firstName ?? '')) {
    patch.first_name = user.first_name ?? null;
  }

  if (Object.keys(patch).length) {
    const { error } = await supabase
      .from('clients')
      .update(patch)
      .eq('telegram_id', user.id);
    if (error) throw error;
  }

  return findClientProfile(supabase, user.id);
}
