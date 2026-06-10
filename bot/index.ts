import { createBot } from './bot.js';
import { assertConfig } from './config.js';

assertConfig();

const bot = createBot();

console.log('[bot] starting (long polling)…');
bot.start({
  onStart: (info) => console.log(`[bot] @${info.username} is running`),
});
