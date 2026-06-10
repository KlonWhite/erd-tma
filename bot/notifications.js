import { InlineKeyboard } from 'grammy';
import { getAdminTelegramIds } from './db.js';
import { parseOrderItems } from './orders.js';
import {
  CLIENT_NOTIFY,
  NEXT_ACTION,
  STATUS_LABEL,
  getNextStatus,
} from './orderStatus.js';

const SHIPPING_LABELS = {
  pickup: '🍽️ Самовывоз',
  courier: '🚚 Доставка',
  postal: '📮 Почта',
};

function formatMoney(amount, currency = 'RUB') {
  const n = Number(amount) || 0;
  const suffix = currency === 'RUB' ? '₽' : currency;
  return `${n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${suffix}`;
}

function formatAddress(order) {
  const addr = (order.address || '').trim();
  if (addr) return addr;
  if (order.shipping === 'pickup') return 'Самовывоз · showroom ERD';
  return '—';
}

function formatItemsBlock(items) {
  if (!items.length) return '—';
  return items
    .map(i => {
      const name = i.name || i.productId || 'Товар';
      const size = i.size ? ` (${i.size})` : '';
      const qty = i.qty ?? 1;
      return `${name}${size} x${qty}`;
    })
    .join('\n');
}

/** Карточка заказа как на макете (Рис. 1.15). */
export function buildPendingOrderCard(order) {
  const items = parseOrderItems(order);
  const shippingLabel = SHIPPING_LABELS[order.shipping] ?? order.shipping;

  return [
    `🆕 <b>Новый заказ ${order.public_id ?? `#${order.id}`}</b>`,
    '',
    `📍 <b>Адрес:</b> ${formatAddress(order)}`,
    `💰 <b>Сумма:</b> ${formatMoney(order.total, order.currency)}`,
    `📦 <b>Тип:</b> ${shippingLabel}`,
    `🍽️ <b>Блюда:</b>`,
    formatItemsBlock(items),
  ].join('\n');
}

/** Карточка в разделе «Мои заказы» — тот же блок, что на макете + статус. */
export function buildMyOrderCard(order) {
  const items = parseOrderItems(order);
  const shippingLabel = SHIPPING_LABELS[order.shipping] ?? order.shipping;
  const status = STATUS_LABEL[order.status] ?? order.status;

  return [
    `📋 <b>Мой заказ #${order.id}</b>`,
    `${status}`,
    '',
    `📍 <b>Адрес:</b> ${formatAddress(order)}`,
    `💰 <b>Сумма:</b> ${formatMoney(order.total, order.currency)}`,
    `📦 <b>Тип:</b> ${shippingLabel}`,
    `🍽️ <b>Блюда:</b>`,
    formatItemsBlock(items),
  ].join('\n');
}

export function buildNewOrderMessage(order, extraLines = []) {
  const base = buildPendingOrderCard(order);
  if (!extraLines.length) return base;
  return [base, ...extraLines.map(l => (l ? `\n${l}` : ''))].join('');
}

/** @deprecated use buildMyOrderCard */
export function buildMyOrderMessage(order) {
  return buildMyOrderCard(order);
}

export function buildOrderDetailMessage(order) {
  const items = parseOrderItems(order);
  const lines = items.map(i => {
    const price = i.price != null ? ` — ${formatMoney(i.price * (i.qty ?? 1), order.currency)}` : '';
    return `• ${i.name || i.productId}${i.size ? ` (${i.size})` : ''} ×${i.qty ?? 1}${price}`;
  });

  return [
    `👁️ <b>Детали заказа #${order.id}</b>`,
    `${order.public_id}`,
    '',
    `📋 ${STATUS_LABEL[order.status] ?? order.status}`,
    `📍 ${formatAddress(order)}`,
    `📦 ${SHIPPING_LABELS[order.shipping] ?? order.shipping}`,
    `💰 Итого: ${formatMoney(order.total, order.currency)}`,
    order.promo_code ? `🏷 Промо: ${order.promo_code}` : '',
    order.discount ? `Скидка: ${formatMoney(order.discount, order.currency)}` : '',
    order.shipping_cost ? `Доставка: ${formatMoney(order.shipping_cost, order.currency)}` : '',
    '',
    '<b>Товары:</b>',
    lines.length ? lines.join('\n') : '—',
    '',
    `Оплата: ${order.payment ?? '—'}`,
    order.client_telegram_id
      ? `Клиент: <a href="tg://user?id=${order.client_telegram_id}">${order.client_name || order.client_telegram_id}</a>`
      : '',
    `Создан: ${order.created_at}`,
  ].filter(Boolean).join('\n');
}

export function pendingOrderKeyboard(orderId) {
  return new InlineKeyboard()
    .text('✅ Принять заказ', `order_accept:${orderId}`)
    .row()
    .text('👁️ Детали заказа', `order_detail:${orderId}`);
}

export function myOrderKeyboard(order) {
  const next = getNextStatus(order);
  if (!next || next === 'accepted' || next === 'pending' || next === 'paid') {
    return new InlineKeyboard().text('👁️ Детали заказа', `order_detail:${order.id}`);
  }

  return new InlineKeyboard()
    .text(NEXT_ACTION[next], `order_next:${order.id}:${next}`)
    .row()
    .text('👁️ Детали заказа', `order_detail:${order.id}`);
}

/** @deprecated */
export function orderInlineKeyboard(orderId) {
  return pendingOrderKeyboard(orderId);
}

export async function notifyAdminsNewOrder(bot, order) {
  const adminIds = await getAdminTelegramIds();
  if (!adminIds.length) {
    console.warn('[bot] ADMIN_TELEGRAM_IDS пуст — уведомления не отправлены');
    return;
  }

  const text = buildPendingOrderCard(order);
  const keyboard = pendingOrderKeyboard(order.id);

  for (const chatId of adminIds) {
    try {
      await bot.api.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });
    } catch (err) {
      console.error(`[bot] notify admin ${chatId}:`, err.message);
    }
  }
}

export async function notifyClientOrderStatus(bot, order, status) {
  const chatId = order.client_telegram_id;
  if (!chatId) return;

  const fn = CLIENT_NOTIFY[status];
  if (!fn) return;

  try {
    await bot.api.sendMessage(chatId, fn(order.id), { parse_mode: 'HTML' });
  } catch (err) {
    console.error(`[bot] notify client ${chatId}:`, err.message);
  }
}
