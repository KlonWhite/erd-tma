import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  adminOrderKeyboard,
  buildCustomerOrderConfirmation,
  buildPendingOrderCard,
  getServerSupabase,
  parseAdminIds,
  sendTelegramMessage,
  validateTelegramInitData,
  wasOrderNotified,
} from '../shared/dist/index.js';
import {
  badRequest,
  getBotToken,
  methodNotAllowed,
  readJsonBody,
  serverError,
  unauthorized,
  forbidden,
} from './_lib/http.js';

interface NotifyBody {
  publicId: string;
  initData: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  try {
    const botToken = getBotToken();
    const { publicId, initData } = readJsonBody<NotifyBody>(req);

    if (!publicId || !initData) {
      badRequest(res, 'publicId and initData are required');
      return;
    }

    const user = validateTelegramInitData(initData, botToken);
    if (!user?.id) {
      unauthorized(res, 'Invalid Telegram initData');
      return;
    }

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
      forbidden(res, 'Order does not belong to this user');
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
        console.error(`[notify-order] admin ${chatId}:`, err);
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
    serverError(res, err);
  }
}
