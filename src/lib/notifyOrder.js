import tg from '../tg.js';

/** Уведомление в Telegram через Vercel API (не требует запущенного long-polling бота). */
export async function notifyOrderCreated(publicId) {
  const initData = tg.app?.initData;
  if (!initData || !publicId) return false;

  try {
    const res = await fetch('/api/notify-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId, initData }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn('[notifyOrder]', res.status, text);
      return false;
    }

    const data = await res.json();
    return Boolean(data?.ok);
  } catch (err) {
    console.warn('[notifyOrder]', err);
    return false;
  }
}
