import 'dotenv/config';

const token = process.env.BOT_TOKEN?.trim();
const baseUrl = (process.env.WEBAPP_URL || process.env.VITE_WEBAPP_URL || '').trim().replace(/\/$/, '');

if (!token || !baseUrl) {
  console.error('Need BOT_TOKEN and WEBAPP_URL');
  process.exit(1);
}

const webhookUrl = `${baseUrl}/api/telegram-webhook`;

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: webhookUrl,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  }),
});

const data = await res.json();
if (!data.ok) {
  console.error('setWebhook failed:', data);
  process.exit(1);
}

console.log(`Webhook set: ${webhookUrl}`);
