import { getServerSupabase } from './_lib/supabaseServer.js';
import { validateTelegramInitData } from './_lib/validateInitData.js';
import { sendTelegramMessage, adminOrderKeyboard } from './_lib/telegramApi.js';
import {
  buildPendingOrderCard,
  buildCustomerOrderConfirmation,
  wasOrderNotified,
} from './_lib/orderMessage.js';

function parseAdminIds() {
  return (process.env.ADMIN_TELEGRAM_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const botToken = process.env.BOT_TOKEN?.trim();
  if (!botToken) {
    res.status(500).json({ error: 'BOT_TOKEN is not configured' });
    return;
  }

  const { publicId, initData } = req.body ?? {};
  if (!publicId || !initData) {
    res.status(400).json({ error: 'publicId and initData are required' });
    return;
  }

  const user = validateTelegramInitData(initData, botToken);
  if (!user?.id) {
    res.status(401).json({ error: 'Invalid Telegram initData' });
    return;
  }

  try {
    const supabase = getServerSupabase();
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('public_id', publicId)
      .maybeSingle();

    if (error) throw error;
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.client_telegram_id && order.client_telegram_id !== user.id) {
      res.status(403).json({ error: 'Order does not belong to this user' });
      return;
    }

    if (wasOrderNotified(order)) {
      res.status(200).json({ ok: true, skipped: true });
      return;
    }

    const customerText = buildCustomerOrderConfirmation(order);
    await sendTelegramMessage(botToken, user.id, customerText);

    const adminIds = parseAdminIds();
    const adminText = buildPendingOrderCard(order);
    const keyboard = adminOrderKeyboard(order.id);

    for (const chatId of adminIds) {
      try {
        await sendTelegramMessage(botToken, chatId, adminText, keyboard);
      } catch (err) {
        console.error(`[notify-order] admin ${chatId}:`, err.message);
      }
    }

    const notifications = [
      ...(order.notifications ?? []),
      { event: 'order_created', at: new Date().toISOString(), channel: 'api' },
    ];

    await supabase
      .from('orders')
      .update({ notifications })
      .eq('id', order.id);

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[notify-order]', err);
    res.status(500).json({ error: err.message ?? 'Notification failed' });
  }
}
