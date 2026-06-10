import { Bot } from 'grammy';
import { BOT_TOKEN } from './config.js';
import { handleStart } from './handlers/start.js';
import { handleMenuText } from './handlers/menu.js';
import { handleWebAppData } from './handlers/webapp.js';
import { handleOrderCallback } from './handlers/orderCallbacks.js';
import { handleDemoOrders, handleDemoSupport } from './handlers/demo.js';
import { handleSupportText } from './handlers/support.js';
import { handleSupportCallback } from './handlers/supportCallbacks.js';

export function createBot(): Bot {
  const bot = new Bot(BOT_TOKEN);

  bot.command('start', handleStart);
  bot.command('demo', handleDemoOrders);
  bot.command('demo_support', (ctx) => handleDemoSupport(ctx, bot));

  bot.on('message:web_app_data', (ctx) => handleWebAppData(ctx, bot));

  bot.on('callback_query:data', async (ctx, next) => {
    if (await handleOrderCallback(ctx, bot)) return;
    if (await handleSupportCallback(ctx, bot)) return;
    await next();
  });

  bot.on('message:text', async (ctx, next) => {
    if (await handleMenuText(ctx)) return;
    if (await handleSupportText(ctx, bot)) return;
    await next();
  });

  bot.catch((err) => {
    console.error('[bot] error:', err.error ?? err);
  });

  return bot;
}
