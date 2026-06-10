import { findClientByTelegramId, isAdmin } from '../db.js';
import {
  addAdminMessage,
  closeDialogueById,
  getDialogue,
  getDialogueMessages,
} from '../support.js';
import {
  formatHistory,
  supportAdminKeyboard,
} from '../supportNotify.js';
import {
  clearAdminReply,
  getAdminReply,
  setAdminReply,
} from '../supportSessions.js';

export async function handleSupportCallback(ctx, bot) {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('support_')) return false;

  const from = ctx.from;
  const client = await findClientByTelegramId(from.id);
  if (!isAdmin(client)) {
    await ctx.answerCallbackQuery({ text: 'Нет доступа', show_alert: true });
    return true;
  }

  const [action, idStr] = data.split(':');
  const dialogueId = Number(idStr);
  const dialogue = await getDialogue(dialogueId);

  if (!dialogue) {
    await ctx.answerCallbackQuery({ text: 'Диалог не найден', show_alert: true });
    return true;
  }

  if (action === 'support_reply') {
    if (dialogue.status !== 'open') {
      await ctx.answerCallbackQuery({ text: 'Диалог закрыт', show_alert: true });
      return true;
    }
    setAdminReply(from.id, dialogueId);
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `✍️ Введите ответ для диалога #${dialogueId}.\nКлиент: ${dialogue.client_name || dialogue.client_username || dialogue.client_telegram_id}\n\n/cancel — отмена`,
    );
    return true;
  }

  if (action === 'support_close') {
    await closeDialogueById(dialogueId);
    clearAdminReply(from.id);
    await ctx.answerCallbackQuery({ text: 'Диалог закрыт' });

    try {
      await bot.api.sendMessage(
        dialogue.client_telegram_id,
        `🔒 Диалог #${dialogueId} закрыт.\n\nЕсли нужна помощь — нажмите «🛟 Техподдержка».`,
      );
    } catch (err) {
      console.error('[bot] support close notify client:', err.message);
    }

    try {
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
    } catch {
      /* ok */
    }
    return true;
  }

  if (action === 'support_history') {
    const messages = await getDialogueMessages(dialogueId);
    await ctx.answerCallbackQuery();
    await ctx.reply(formatHistory(dialogue, messages), {
      parse_mode: 'HTML',
      reply_markup: dialogue.status === 'open' ? supportAdminKeyboard(dialogueId) : undefined,
    });
    return true;
  }

  return false;
}

export async function handleSupportAdminText(ctx, bot) {
  const from = ctx.from;
  const text = ctx.message?.text?.trim();
  if (!from || !text) return false;

  const client = await findClientByTelegramId(from.id);
  if (!isAdmin(client)) return false;

  if (text === '/cancel') {
    if (getAdminReply(from.id)) {
      clearAdminReply(from.id);
      await ctx.reply('Ответ отменён.');
      return true;
    }
    return false;
  }

  const dialogueId = getAdminReply(from.id);
  if (!dialogueId) return false;

  const dialogue = await getDialogue(dialogueId);
  if (!dialogue || dialogue.status !== 'open') {
    clearAdminReply(from.id);
    await ctx.reply('Диалог недоступен или закрыт.');
    return true;
  }

  await addAdminMessage(dialogueId, from.id, text);
  clearAdminReply(from.id);

  try {
    await bot.api.sendMessage(
      dialogue.client_telegram_id,
      `🛟 <b>Ответ поддержки ERD</b>\n\n${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}`,
      { parse_mode: 'HTML' },
    );
  } catch (err) {
    await ctx.reply(`Не удалось отправить клиенту: ${err.message}`);
    return true;
  }

  await ctx.reply(`✅ Ответ отправлен (диалог #${dialogueId}).`);
  return true;
}
