import { findClientByTelegramId, upsertClientFromMessage } from '../db.js';
import { BTN, buildMainKeyboard } from '../keyboards.js';
import { handleAvailableOrders, handleMyOrders } from './orderCallbacks.js';
import { handleSupportMenu } from './support.js';
import {
  ABOUT_SHOP,
  DELIVERY_TERMS,
  HELP_TEXT,
  WORKING_HOURS,
  profileText,
} from '../messages.js';

const INFO_MAP = {
  [BTN.ABOUT]: ABOUT_SHOP,
  [BTN.DELIVERY]: DELIVERY_TERMS,
  [BTN.HOURS]: WORKING_HOURS,
  [BTN.HELP]: HELP_TEXT,
};

export async function handleMenuText(ctx) {
  const text = ctx.message?.text?.trim();
  if (!text || text.startsWith('/')) return false;

  const from = ctx.from;
  if (!from) return false;

  let client = await findClientByTelegramId(from.id);
  if (!client) {
    ({ client } = await upsertClientFromMessage(from));
  }

  const keyboard = buildMainKeyboard(client);

  if (await handleSupportMenu(ctx)) {
    return true;
  }

  if (text === BTN.AVAILABLE_ORDERS) {
    return handleAvailableOrders(ctx);
  }

  if (text === BTN.MY_ORDERS) {
    return handleMyOrders(ctx);
  }

  if (text === BTN.PROFILE) {
    await ctx.reply(profileText(client), {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
    return true;
  }

  const info = INFO_MAP[text];
  if (info) {
    await ctx.reply(info, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
    return true;
  }

  return false;
}
