import { findClientByTelegramId, isAdmin } from '../db.js';
import { seedDemoOrders } from '../orders.js';
import { seedDemoSupport } from '../support.js';
import { notifyAdminsSupportMessage } from '../supportNotify.js';
import { handleAvailableOrders, handleMyOrders } from './orderCallbacks.js';

export async function handleDemoOrders(ctx) {
  const client = await findClientByTelegramId(ctx.from?.id);
  if (!isAdmin(client)) {
    await ctx.reply('Команда только для администраторов.');
    return;
  }

  const adminId = ctx.from.id;
  const result = await seedDemoOrders(adminId);

  if (result.skipped) {
    const accepted = result.accepted;
    if (accepted) {
      await ctx.reply(`Заказ #${accepted.id} добавлен в «Мои заказы».`);
      return handleMyOrders(ctx);
    }
    await ctx.reply('Демо-заказы уже есть. Примите один из «Доступных» или откройте «Мои заказы».');
    return handleAvailableOrders(ctx);
  }

  const acceptedNote = result.accepted
    ? `\nЗаказ #${result.accepted.id} уже в «Мои заказы».`
    : '';
  await ctx.reply(`Добавлено тестовых заказов: ${result.created}.${acceptedNote}`);
  await handleAvailableOrders(ctx);
  return handleMyOrders(ctx);
}

export async function handleDemoSupport(ctx, bot) {
  const client = await findClientByTelegramId(ctx.from?.id);
  if (!isAdmin(client)) {
    await ctx.reply('Команда только для администраторов.');
    return;
  }

  const { dialogue, text } = await seedDemoSupport('Ошибка');
  await notifyAdminsSupportMessage(bot, dialogue, text);

  await ctx.reply(
    `🛟 Демо-сообщение в поддержку отправлено.\nДиалог #${dialogue.id} · «${text}»\n\nПроверьте уведомление с кнопками «Ответить» / «Закрыть» / «История».`,
  );
}
