import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createOrderOnServer,
  getServerSupabase,
  type CreateOrderPayload,
} from '../shared/dist/index.js';
import {
  badRequest,
  methodNotAllowed,
  readJsonBody,
  serverError,
  unauthorized,
} from './_lib/http.js';
import { resolveTelegramIdentity } from './_lib/telegramIdentity.js';

interface OrdersBody {
  initData?: string;
  fallbackUser?: string;
  fallbackSignature?: string;
  order: CreateOrderPayload;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  try {
    const { order, ...identityBody } = readJsonBody<OrdersBody>(req);

    if ((!identityBody.initData && !identityBody.fallbackUser) || !order?.items?.length) {
      badRequest(res, 'Telegram identity and order.items are required');
      return;
    }

    const identity = resolveTelegramIdentity(identityBody);
    if (!identity?.user?.id) {
      unauthorized(res, 'Invalid Telegram identity');
      return;
    }

    const supabase = getServerSupabase();
    const created = await createOrderOnServer(supabase, order, identity.user);

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
