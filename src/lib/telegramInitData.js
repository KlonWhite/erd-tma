import tg from '../tg.js';

function readInitData() {
  const raw = tg.app?.initData;
  return typeof raw === 'string' && raw.length > 0 ? raw : '';
}

/** Подписанная строка initData для API (только внутри Telegram Mini App). */
export function getTelegramInitData() {
  return readInitData();
}

/** Есть ли реальный запуск из Telegram (не браузерный stub telegram-web-app.js). */
export function isTelegramMiniApp() {
  if (readInitData()) return true;
  return Boolean(tg.app?.initDataUnsafe?.user?.id);
}

/** initData иногда появляется сразу после WebApp.ready(). */
export function waitForTelegramInitData(timeoutMs = 3000) {
  const immediate = readInitData();
  if (immediate) return Promise.resolve(immediate);

  return new Promise((resolve) => {
    try {
      tg.app?.ready?.();
    } catch {
      // ignore
    }

    const started = Date.now();
    const tick = () => {
      const data = readInitData();
      if (data || Date.now() - started >= timeoutMs) {
        resolve(data);
        return;
      }
      setTimeout(tick, 50);
    };
    tick();
  });
}
