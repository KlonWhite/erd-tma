import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServerSupabase } from '../shared/dist/index.js';
import {
  badRequest,
  methodNotAllowed,
  readJsonBody,
  serverError,
  unauthorized,
} from './_lib/http.js';
import {
  resolveTelegramIdentity,
  syncClientProfile,
} from './_lib/telegramIdentity.js';

interface ProfileBody {
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
    const body = readJsonBody<ProfileBody>(req);
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
    const client = await syncClientProfile(supabase, identity.user);

    const [ordersRes, wishlistRes] = await Promise.all([
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('client_telegram_id', identity.user.id),
      supabase
        .from('wishlists')
        .select('id', { count: 'exact', head: true })
        .eq('client_telegram_id', identity.user.id),
    ]);

    if (ordersRes.error) throw ordersRes.error;
    if (wishlistRes.error) throw wishlistRes.error;

    res.status(200).json({
      ok: true,
      source: identity.source,
      verified: identity.verified,
      user: {
        id: identity.user.id,
        firstName: client?.firstName || identity.user.first_name || '',
        username: client?.username || identity.user.username || '',
        roles: client?.roles ?? ['client'],
        memberSince: client?.createdAt ?? null,
      },
      stats: {
        orders: ordersRes.count ?? 0,
        wishlist: wishlistRes.count ?? 0,
      },
    });
  } catch (err) {
    serverError(res, err);
  }
}
