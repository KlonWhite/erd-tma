import { InlineKeyboard } from 'grammy';
import { getAdminTelegramIds } from './db.js';
import { formatUserLine } from './support.js';

export function buildSupportAdminMessage(dialogue, messageText) {
  return [
    '🛟 <b>Техническая поддержка: новое сообщение</b>',
    '',
    `💬 Диалог: #${dialogue.id}`,
    formatUserLine(dialogue),
    `🆔 ID: <code>${dialogue.client_telegram_id}</code>`,
    '',
    `📝 ${escapeHtml(messageText)}`,
  ].join('\n');
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function supportAdminKeyboard(dialogueId) {
  return new InlineKeyboard()
    .text('✍️ Ответить (Техническая поддержка)', `support_reply:${dialogueId}`)
    .row()
    .text('🔒 Закрыть диалог', `support_close:${dialogueId}`)
    .row()
    .text('📜 История диалога', `support_history:${dialogueId}`);
}

export async function notifyAdminsSupportMessage(bot, dialogue, messageText) {
  const adminIds = await getAdminTelegramIds();
  const text = buildSupportAdminMessage(dialogue, messageText);
  const keyboard = supportAdminKeyboard(dialogue.id);

  for (const chatId of adminIds) {
    try {
      await bot.api.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });
    } catch (err) {
      console.error(`[bot] support notify ${chatId}:`, err.message);
    }
  }
}

export function formatHistory(dialogue, messages) {
  const lines = [
    `📜 <b>История диалога #${dialogue.id}</b>`,
    formatUserLine(dialogue),
    `🆔 ID: <code>${dialogue.client_telegram_id}</code>`,
    `Статус: ${dialogue.status === 'open' ? 'открыт' : 'закрыт'}`,
    '',
  ];

  if (!messages.length) {
    lines.push('<i>Сообщений нет</i>');
    return lines.join('\n');
  }

  for (const m of messages) {
    const who = m.from_role === 'admin' ? '🛟 Поддержка' : '👤 Клиент';
    const time = m.created_at?.slice(11, 16) ?? '';
    lines.push(`${who} ${time ? `(${time})` : ''}:\n${escapeHtml(m.text)}\n`);
  }

  return lines.join('\n');
}
