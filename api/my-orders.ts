import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServerSupabase } from '../shared/dist/index.js';
import { rowToAdminOrder } from './_lib/adminMappers.js';
import {
  badRequest,
  methodNotAllowed,
  readJsonBody,
  serverError,
  unauthorized,
} from './_lib/http.js';
import { resolveTelegramIdentity } from './_lib/telegramIdentity.js';

interface MyOrdersBody {
  initData?: string;
  fallbackUser?: string;
  fallbackSignature?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  try {
    const body = readJsonBody<MyOrdersBody>(req);
    if (!body.initData && !body.fallbackUser) {
      badRequest(res, 'Telegram identity is required');
      return;
    }

    const identity = resolveTelegramIdentity(body);
    if (!identity?.user?.id) {
      unauthorized(res, 'Invalid Telegram identity');
      return;
    }

    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('client_telegram_id', identity.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.status(200).json({
      ok: true,
      orders: (data ?? []).map(rowToAdminOrder),
    });
  } catch (err) {
    serverError(res, err);
  }
}
