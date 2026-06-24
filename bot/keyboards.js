import { Keyboard } from 'grammy';
import crypto from 'node:crypto';
import { WEBAPP_URL } from './config.js';
import { isAdmin } from './db.js';
import { BOT_TOKEN } from './config.js';

export const BTN = {
  OPEN_SHOP: '🛍️ Открыть магазин',
  ABOUT: 'ℹ️ О магазине',
  DELIVERY: '📦 Условия доставки',
  HOURS: '🕐 Режим работы',
  ADMIN: '⚙️ Админ-панель',
  AVAILABLE_ORDERS: '✅ Доступные заказы',
  MY_ORDERS: '📋 Мои заказы',
  PROFILE: '👤 Профиль',
  HELP: '❓ Помощь',
  SUPPORT: '🛟 Техподдержка',
};

export function webAppUrlForClient(client, path = '') {
  const url = new URL(path, WEBAPP_URL);
  url.searchParams.set('source', 'bot_keyboard');
  url.searchParams.set('v', 'account-user-v3');

  if (client?.telegram_id) {
    const fallbackUser = {
      id: client.telegram_id,
      first_name: client.first_name ?? '',
      username: client.username ?? '',
      auth_date: Math.floor(Date.now() / 1000),
    };
    const payload = Buffer.from(JSON.stringify(fallbackUser)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', BOT_TOKEN)
      .update(payload)
      .digest('hex');
    url.searchParams.set('tg_user', payload);
    url.searchParams.set('tg_sig', signature);
  }

  return url.toString();
}

export function buildMainKeyboard(client) {
  const kb = new Keyboard()
    .webApp(BTN.OPEN_SHOP, webAppUrlForClient(client))
    .row()
    .text(BTN.ABOUT)
    .row()
    .text(BTN.DELIVERY)
    .row()
    .text(BTN.HOURS);

  if (isAdmin(client)) {
    kb.row().webApp(BTN.ADMIN, webAppUrlForClient(client, '/admin'));
    kb.row().text(BTN.AVAILABLE_ORDERS).text(BTN.MY_ORDERS);
  }

  kb.row()
    .text(BTN.SUPPORT)
    .row()
    .text(BTN.PROFILE)
    .text(BTN.HELP);

  return kb.resized().persistent();
}
