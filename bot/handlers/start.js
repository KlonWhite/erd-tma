import { upsertClientFromMessage } from '../db.js';
import { buildLaunchKeyboard, buildMainKeyboard } from '../keyboards.js';
import { welcomeText } from '../messages.js';

export async function handleStart(ctx) {
  const from = ctx.from;
  if (!from) return;

  const { client, isNew } = await upsertClientFromMessage(from);

  await ctx.reply(welcomeText(client, isNew), {
    parse_mode: 'HTML',
    reply_markup: buildMainKeyboard(client),
  });

  await ctx.reply('🛍️ Запуск магазина:', {
    reply_markup: buildLaunchKeyboard(client),
  });
}
