import { Keyboard } from 'grammy';
import { WEBAPP_URL, ADMIN_URL } from './config.js';
import { isAdmin } from './db.js';

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

export function buildMainKeyboard(client) {
  const kb = new Keyboard()
    .webApp(BTN.OPEN_SHOP, WEBAPP_URL)
    .row()
    .text(BTN.ABOUT)
    .row()
    .text(BTN.DELIVERY)
    .row()
    .text(BTN.HOURS);

  if (isAdmin(client)) {
    kb.row().webApp(BTN.ADMIN, ADMIN_URL);
    kb.row().text(BTN.AVAILABLE_ORDERS).text(BTN.MY_ORDERS);
  }

  kb.row()
    .text(BTN.SUPPORT)
    .row()
    .text(BTN.PROFILE)
    .text(BTN.HELP);

  return kb.resized().persistent();
}
