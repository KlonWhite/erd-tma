import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getServerSupabase,
  validatePromoCode,
} from '../shared/dist/index.js';
import {
  badRequest,
  methodNotAllowed,
  readJsonBody,
  serverError,
} from './_lib/http.js';

interface PromoValidateBody {
  code: string;
  subtotal: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  try {
    const { code, subtotal } = readJsonBody<PromoValidateBody>(req);
    if (!code?.trim()) {
      badRequest(res, 'code is required');
      return;
    }

    const supabase = getServerSupabase();
    const result = await validatePromoCode(supabase, code, Number(subtotal) || 0);

    if (!result.ok) {
      res.status(200).json({ ok: false, error: result.error });
      return;
    }

    res.status(200).json({
      ok: true,
      promo: {
        code: result.promo.code,
        type: result.promo.type,
        value: result.promo.value,
        label: result.promo.label,
        minSubtotal: result.promo.min_subtotal,
        maxUses: result.promo.max_uses,
        expiresAt: result.promo.expires_at,
      },
      discount: result.discount,
    });
  } catch (err) {
    serverError(res, err);
  }
}
