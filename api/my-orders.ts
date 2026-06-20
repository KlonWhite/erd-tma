import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getServerSupabase,
  validateTelegramInitData,
} from '../shared/dist/index.js';
import { rowToAdminOrder } from './_lib/adminMappers.js';
import {
  badRequest,
  getBotToken,
  methodNotAllowed,
  readJsonBody,
  serverError,
  unauthorized,
} from './_lib/http.js';

interface MyOrdersBody {
  initData: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  try {
    const { initData } = readJsonBody<MyOrdersBody>(req);
    if (!initData) {
      badRequest(res, 'initData is required');
      return;
    }

    const user = validateTelegramInitData(initData, getBotToken());
    if (!user?.id) {
      unauthorized(res, 'Invalid Telegram initData');
      return;
    }

    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('client_telegram_id', user.id)
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
