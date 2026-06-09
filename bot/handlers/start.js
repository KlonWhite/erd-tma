import { upsertClientFromMessage } from '../db.js';
import { buildMainKeyboard } from '../keyboards.js';
import { welcomeText } from '../messages.js';

export async function handleStart(ctx) {
  const from = ctx.from;
  if (!from) return;

  const { client, isNew } = await upsertClientFromMessage(from);

  await ctx.reply(welcomeText(client, isNew), {
    parse_mode: 'Markdown',
    reply_markup: buildMainKeyboard(client),
  });
}
