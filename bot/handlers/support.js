import { findClientByTelegramId, isAdmin } from '../db.js';
import { BTN, buildMainKeyboard } from '../keyboards.js';
import {
  addClientMessage,
  getOpenDialogueForClient,
  getOrCreateOpenDialogue,
} from '../support.js';
import { notifyAdminsSupportMessage } from '../supportNotify.js';
import {
  clearAwaitingSupport,
  isAwaitingSupport,
  setAwaitingSupport,
} from '../supportSessions.js';
import { handleSupportAdminText } from './supportCallbacks.js';

const MENU_BUTTONS = new Set(Object.values(BTN));

export async function handleSupportMenu(ctx) {
  const from = ctx.from;
  if (!from) return false;

  const text = ctx.message?.text?.trim();
  if (text !== BTN.SUPPORT) return false;

  let client = await findClientByTelegramId(from.id);
  if (!client) return false;

  if (isAdmin(client)) {
    await ctx.reply(
      '🛟 Уведомления поддержки приходят в этот чат.\nНажмите «Ответить» под сообщением клиента.\n/cancel — отменить ввод ответа.',
      { reply_markup: buildMainKeyboard(client) },
    );
    return true;
  }

  setAwaitingSupport(from.id);
  const open = await getOpenDialogueForClient(from.id);

  await ctx.reply(
    open
      ? `🛟 Диалог #${open.id} открыт.\n\nНапишите сообщение — мы передадим его в поддержку.`
      : '🛟 <b>Техническая поддержка</b>\n\nОпишите вопрос или проблему одним сообщением — оператор ответит в этом чате.',
    {
      parse_mode: 'HTML',
      reply_markup: buildMainKeyboard(client),
    },
  );
  return true;
}

export async function handleSupportText(ctx, bot) {
  const from = ctx.from;
  const text = ctx.message?.text?.trim();
  if (!from || !text || text.startsWith('/')) return false;

  if (MENU_BUTTONS.has(text)) return false;

  if (await handleSupportAdminText(ctx, bot)) return true;

  const awaiting = isAwaitingSupport(from.id);
  const openDialogue = await getOpenDialogueForClient(from.id);

  if (!awaiting && !openDialogue) return false;

  let client = await findClientByTelegramId(from.id);
  if (!client) return false;
  if (isAdmin(client)) return false;

  clearAwaitingSupport(from.id);
  const dialogue = await getOrCreateOpenDialogue(from);
  await addClientMessage(dialogue.id, from, text);
  await notifyAdminsSupportMessage(bot, dialogue, text);

  await ctx.reply(
    `✅ Сообщение отправлено в поддержку (диалог #${dialogue.id}).\nОжидайте ответа в этом чате.`,
    { reply_markup: buildMainKeyboard(client) },
  );
  return true;
}
