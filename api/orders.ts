import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createOrderOnServer,
  getServerSupabase,
  validateTelegramInitData,
  type CreateOrderPayload,
} from '../shared/dist/index.js';
import {
  badRequest,
  getBotToken,
  methodNotAllowed,
  readJsonBody,
  serverError,
  unauthorized,
} from './_lib/http.js';

interface OrdersBody {
  initData: string;
  order: CreateOrderPayload;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  try {
    const botToken = getBotToken();
    const { initData, order } = readJsonBody<OrdersBody>(req);

    if (!initData || !order?.items?.length) {
      badRequest(res, 'initData and order.items are required');
      return;
    }

    const user = validateTelegramInitData(initData, botToken);
    if (!user?.id) {
      unauthorized(res, 'Invalid Telegram initData');
      return;
    }

    const supabase = getServerSupabase();
    const created = await createOrderOnServer(supabase, order, user);

    res.status(200).json({
      ok: true,
      order: {
        publicId: created.public_id,
        dbId: created.id,
        total: created.total,
        subtotal: created.subtotal,
        discount: created.discount,
        shippingCost: created.shipping_cost,
        currency: created.currency,
        status: created.status,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Order creation failed';
    if (message.includes('Недостаточно') || message.includes('не найден') || message.includes('пуста')) {
      res.status(400).json({ error: message });
      return;
    }
    serverError(res, err);
  }
}
