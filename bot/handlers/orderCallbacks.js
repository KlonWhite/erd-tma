import { findClientByTelegramId, isAdmin } from '../db.js';
import {
  acceptOrder,
  advanceOrderStatus,
  getMyActiveOrders,
  getOrder,
  getPendingOrders,
} from '../orders.js';
import { canAccept, STATUS } from '../orderStatus.js';
import {
  buildMyOrderCard,
  buildNewOrderMessage,
  buildOrderDetailMessage,
  buildPendingOrderCard,
  myOrderKeyboard,
  notifyClientOrderStatus,
  pendingOrderKeyboard,
} from '../notifications.js';

function adminDisplayName(from) {
  return from.first_name || from.username || String(from.id);
}

export async function handleOrderCallback(ctx, bot) {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('order_')) return false;

  const from = ctx.from;
  const client = await findClientByTelegramId(from.id);
  if (!isAdmin(client)) {
    await ctx.answerCallbackQuery({ text: 'Нет доступа', show_alert: true });
    return true;
  }

  const parts = data.split(':');
  const action = parts[0];
  const orderId = Number(parts[1]);
  const order = await getOrder(orderId);

  if (!order) {
    await ctx.answerCallbackQuery({ text: 'Заказ не найден', show_alert: true });
    return true;
  }

  if (action === 'order_accept') {
    if (!canAccept(order)) {
      await ctx.answerCallbackQuery({ text: 'Заказ уже принят', show_alert: true });
      return true;
    }

    const updated = await acceptOrder(orderId, from.id);
    await notifyClientOrderStatus(bot, updated, STATUS.ACCEPTED);
    await ctx.answerCallbackQuery({ text: `Заказ #${orderId} принят` });

    const text = buildNewOrderMessage(updated, [
      `✅ Принят: ${adminDisplayName(from)}`,
      'Откройте «📋 Мои заказы» для смены статуса',
    ]);

    try {
      await ctx.editMessageText(text, { parse_mode: 'HTML' });
    } catch {
      /* unchanged */
    }
    return true;
  }

  if (action === 'order_next') {
    const expectedNext = parts[2];
    const actualNext = await advanceOrderStatus(orderId, from.id);

    if (actualNext?.error === 'assigned_other') {
      await ctx.answerCallbackQuery({ text: 'Заказ у другого админа', show_alert: true });
      return true;
    }

    if (!actualNext) {
      await ctx.answerCallbackQuery({ text: 'Нельзя сменить статус', show_alert: true });
      return true;
    }

    if (expectedNext && actualNext.status !== expectedNext) {
      await ctx.answerCallbackQuery({ text: 'Статус уже обновлён', show_alert: true });
      return true;
    }

    await notifyClientOrderStatus(bot, actualNext, actualNext.status);
    await ctx.answerCallbackQuery({ text: `Заказ #${orderId}: обновлён` });

    const text = buildMyOrderCard(actualNext);
    const keyboard = myOrderKeyboard(actualNext);
    const done = actualNext.status === 'delivered';

    try {
      await ctx.editMessageText(
        done ? `${text}\n\n✅ Заказ завершён.` : text,
        { parse_mode: 'HTML', reply_markup: done ? undefined : keyboard },
      );
    } catch {
      /* unchanged */
    }
    return true;
  }

  if (action === 'order_detail') {
    await ctx.answerCallbackQuery();
    await ctx.reply(buildOrderDetailMessage(order), { parse_mode: 'HTML' });
    return true;
  }

  return false;
}

export async function handleAvailableOrders(ctx) {
  const from = ctx.from;
  const client = await findClientByTelegramId(from.id);
  if (!isAdmin(client)) {
    await ctx.reply('Эта команда только для администраторов.');
    return true;
  }

  const orders = await getPendingOrders();
  if (!orders.length) {
    await ctx.reply(
      '📭 Нет доступных заказов.\n\nОформите заказ в Mini App или отправьте /demo — добавить тестовые заказы.',
    );
    return true;
  }

  for (const order of orders) {
    await ctx.api.sendMessage(ctx.chat.id, buildPendingOrderCard(order), {
      parse_mode: 'HTML',
      reply_markup: pendingOrderKeyboard(order.id),
    });
  }

  return true;
}

export async function handleMyOrders(ctx) {
  const from = ctx.from;
  const client = await findClientByTelegramId(from.id);
  if (!isAdmin(client)) {
    await ctx.reply('Эта команда только для администраторов.');
    return true;
  }

  const orders = await getMyActiveOrders(from.id);
  if (!orders.length) {
    await ctx.reply(
      '📭 У вас нет активных заказов.\n\nПримите заказ в «✅ Доступные заказы» или /demo — тестовые данные.',
    );
    return true;
  }

  for (const order of orders) {
    await ctx.api.sendMessage(ctx.chat.id, buildMyOrderCard(order), {
      parse_mode: 'HTML',
      reply_markup: myOrderKeyboard(order),
    });
  }

  return true;
}
