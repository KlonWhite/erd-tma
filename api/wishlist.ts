import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getServerSupabase,
  validateTelegramInitData,
} from '../shared/dist/index.js';
import {
  badRequest,
  getBotToken,
  methodNotAllowed,
  readJsonBody,
  serverError,
  unauthorized,
} from './_lib/http.js';

interface WishlistBody {
  action?: 'list' | 'toggle' | 'sync';
  initData: string;
  productId?: string;
  productIds?: string[];
}

function cleanIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  return [...new Set(
    ids
      .map((id) => String(id ?? '').trim())
      .filter(Boolean),
  )];
}

async function getWishlist(supabase: ReturnType<typeof getServerSupabase>, telegramId: number) {
  const { data, error } = await supabase
    .from('wishlists')
    .select('product_id')
    .eq('client_telegram_id', telegramId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => row.product_id);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  try {
    const { action = 'list', initData, productId, productIds = [] } = readJsonBody<WishlistBody>(req);
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

    if (action === 'toggle') {
      const id = String(productId ?? '').trim();
      if (!id) {
        badRequest(res, 'productId is required');
        return;
      }

      const { data: existing, error: findError } = await supabase
        .from('wishlists')
        .select('id')
        .eq('client_telegram_id', user.id)
        .eq('product_id', id)
        .maybeSingle();

      if (findError) throw findError;

      if (existing) {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert({ client_telegram_id: user.id, product_id: id });
        if (error) throw error;
      }

      res.status(200).json({
        ok: true,
        wishlist: await getWishlist(supabase, user.id),
      });
      return;
    }

    if (action === 'sync') {
      const ids = cleanIds(productIds);
      if (ids.length) {
        const { data: products, error: productError } = await supabase
          .from('products')
          .select('id')
          .in('id', ids);
        if (productError) throw productError;

        const knownIds = new Set((products ?? []).map((p) => p.id));
        const rows = ids
          .filter((id) => knownIds.has(id))
          .map((id) => ({ client_telegram_id: user.id, product_id: id }));

        if (rows.length) {
          const { error } = await supabase
            .from('wishlists')
            .upsert(rows, { onConflict: 'client_telegram_id,product_id' });
          if (error) throw error;
        }
      }

      res.status(200).json({
        ok: true,
        wishlist: await getWishlist(supabase, user.id),
      });
      return;
    }

    res.status(200).json({
      ok: true,
      wishlist: await getWishlist(supabase, user.id),
    });
  } catch (err) {
    serverError(res, err);
  }
}
