import tg from '../tg.js';
import { getTelegramInitData, waitForTelegramInitData } from './telegramInitData.js';

export function getTelegramLaunchAuth() {
  const fallback = tg.launchAuth;
  if (!fallback?.fallbackUser || !fallback?.fallbackSignature) return {};

  return {
    fallbackUser: fallback.fallbackUser,
    fallbackSignature: fallback.fallbackSignature,
  };
}

export async function getTelegramIdentity(timeoutMs = 3000) {
  const initData = getTelegramInitData() || await waitForTelegramInitData(timeoutMs);
  if (initData) return { initData };
  return getTelegramLaunchAuth();
}

export function hasTelegramIdentity() {
  return Boolean(getTelegramInitData() || tg.launchAuth?.fallbackUser);
}
