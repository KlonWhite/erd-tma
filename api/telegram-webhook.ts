import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createBot } from '../bot/bot.js';
import { assertConfig } from '../bot/config.js';

let bot: ReturnType<typeof createBot> | null = null;

function getBot() {
  if (!bot) {
    assertConfig();
    bot = createBot();
  }
  return bot;
}

export default async function telegramWebhook(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    res.status(200).send('ERD bot webhook is active');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    await getBot().handleUpdate(req.body);
    res.status(200).end('ok');
  } catch (err) {
    console.error('[telegram-webhook]', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}
