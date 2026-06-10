import crypto from 'crypto';
import type { TelegramUser } from './types.js';

/** Проверка initData из Telegram Mini App (HMAC-SHA256). */
export function validateTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSec = 86400,
): TelegramUser | null {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculated = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calculated !== hash) return null;

  const authDate = Number(params.get('auth_date'));
  if (authDate && maxAgeSec > 0) {
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > maxAgeSec) return null;
  }

  const userStr = params.get('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as TelegramUser;
  } catch {
    return null;
  }
}
