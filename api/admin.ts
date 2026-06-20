import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getServerSupabase,
  isTelegramAdmin,
  requireTelegramAdmin,
  validateTelegramInitData,
} from '../shared/dist/index.js';
import {
  mapCategory,
  mapProduct,
  mapPromo,
  productToRow,
  promoToRow,
  rowToAdminOrder,
  toAdminStatus,
  toBotStatus,
} from './_lib/adminMappers.js';
import { sendTelegramMessage } from '../shared/dist/index.js';
import {
  badRequest,
  getBotToken,
  methodNotAllowed,
  readJsonBody,
  serverError,
  unauthorized,
} from './_lib/http.js';

interface AdminBody {
  action: string;
  initData: string;
  data?: Record<string, unknown>;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'НОВЫЙ',
  processing: 'В ОБРАБОТКЕ',
  shipped: 'ОТПРАВЛЕН',
  delivered: 'ДОСТАВЛЕН',
  cancelled: 'ОТМЕНЁН',
};

function buildStatusMessage(orderId: string, status: string) {
  const label = STATUS_LABELS[status] ?? status;
  const lines = [
    `🖤 ERD · заказ ${orderId}`,
    '',
    `Статус обновлён: <b>${label}</b>`,
  ];

  if (status === 'processing') {
    lines.push('', 'Мы приняли заказ и готовим его к отправке.');
  }
  if (status === 'shipped') {
    lines.push('', 'Заказ передан в доставку. Трек-номер появится в карточке заказа.');
  }
  if (status === 'delivered') {
    lines.push('', 'Заказ доставлен. Спасибо за покупку.');
  }
  if (status === 'cancelled') {
    lines.push('', 'Заказ отменён. Если это ошибка, напишите в поддержку.');
  }

  return lines.join('\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  try {
    const botToken = getBotToken();
    const { action, initData, data = {} } = readJsonBody<AdminBody>(req);

    if (!action || !initData) {
      badRequest(res, 'action and initData are required');
      return;
    }

    const user = validateTelegramInitData(initData, botToken);
    if (!user?.id) {
      unauthorized(res, 'Invalid Telegram initData');
      return;
    }

    const supabase = getServerSupabase();

    if (action === 'verify') {
      const isAdmin = await isTelegramAdmin(supabase, user);
      res.status(200).json({
        ok: true,
        isAdmin,
        user: {
          id: user.id,
          firstName: user.first_name,
          username: user.username,
        },
      });
      return;
    }

    await requireTelegramAdmin(supabase, user);

    switch (action) {
      case 'bootstrap': {
        const [productsRes, categoriesRes, ordersRes, promosRes] = await Promise.all([
          supabase.from('products').select('*').order('name'),
          supabase.from('categories').select('*').order('name'),
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('promos').select('*').order('code'),
        ]);

        if (productsRes.error) throw productsRes.error;
        if (categoriesRes.error) throw categoriesRes.error;
        if (ordersRes.error) throw ordersRes.error;
        if (promosRes.error) throw promosRes.error;

        res.status(200).json({
          ok: true,
          products: (productsRes.data ?? []).map(mapProduct),
          categories: (categoriesRes.data ?? []).map(mapCategory),
          orders: (ordersRes.data ?? []).map(rowToAdminOrder),
          promos: (promosRes.data ?? []).map(mapPromo),
        });
        return;
      }

      case 'updateOrder': {
        const orderId = String(data.orderId ?? '');
        const patch = (data.patch ?? {}) as Record<string, unknown>;
        const { data: existing, error: findError } = await supabase
          .from('orders')
          .select('*')
          .eq('public_id', orderId)
          .maybeSingle();

        if (findError) throw findError;
        if (!existing) {
          res.status(404).json({ error: 'Order not found' });
          return;
        }

        const updates: Record<string, unknown> = {};
        let statusNotification: { at: string; message: string } | null = null;
        let statusMessage = '';
        if (patch.status != null) {
          const nextStatus = String(patch.status);
          updates.status = toBotStatus(nextStatus);

          if (toAdminStatus(existing.status as string) !== nextStatus) {
            const label = STATUS_LABELS[nextStatus] ?? nextStatus;
            statusMessage = buildStatusMessage(orderId, nextStatus);
            statusNotification = {
              at: new Date().toISOString(),
              message: `Статус заказа ${orderId} изменён на «${label}»`,
            };
            updates.notifications = [
              ...((existing.notifications as unknown[]) ?? []),
              statusNotification,
            ];
          }
        }
        if (patch.totalAmount != null) updates.total = Number(patch.totalAmount);
        if ((patch.delivery as Record<string, unknown>)?.address != null) {
          updates.address = (patch.delivery as Record<string, unknown>).address;
          updates.delivery = {
            ...((existing.delivery as Record<string, unknown>) ?? {}),
            ...(patch.delivery as Record<string, unknown>),
          };
        }
        if (patch.shipping != null) {
          updates.shipping_detail = {
            ...((existing.shipping_detail as Record<string, unknown>) ?? {}),
            ...(patch.shipping as Record<string, unknown>),
          };
          const shipping = patch.shipping as Record<string, unknown>;
          if (shipping.id) updates.shipping = shipping.id;
          if (shipping.cost != null) updates.shipping_cost = shipping.cost;
        }
        if (patch.notifications != null) updates.notifications = patch.notifications;
        if (statusNotification) {
          updates.notifications = [
            ...((existing.notifications as unknown[]) ?? []),
            statusNotification,
          ];
        }

        const { data: updated, error } = await supabase
          .from('orders')
          .update(updates)
          .eq('id', existing.id)
          .select('*')
          .single();

        if (error) throw error;

        if (statusNotification && existing.client_telegram_id) {
          try {
            await sendTelegramMessage(
              botToken,
              Number(existing.client_telegram_id),
              statusMessage,
            );
          } catch (notifyErr) {
            console.error('[admin:updateOrder] status notify failed:', notifyErr);
          }
        }

        res.status(200).json({ ok: true, order: rowToAdminOrder(updated) });
        return;
      }

      case 'upsertProduct': {
        const product = data.product as Record<string, unknown>;
        const { data: saved, error } = await supabase
          .from('products')
          .upsert(productToRow(product), { onConflict: 'id' })
          .select('*')
          .single();
        if (error) throw error;
        res.status(200).json({ ok: true, product: mapProduct(saved) });
        return;
      }

      case 'deleteProduct': {
        const id = String(data.id ?? '');
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        res.status(200).json({ ok: true });
        return;
      }

      case 'upsertCategory': {
        const category = data.category as Record<string, unknown>;
        const { data: saved, error } = await supabase
          .from('categories')
          .upsert(
            { id: category.id, name: category.name, slug: category.slug },
            { onConflict: 'id' },
          )
          .select('*')
          .single();
        if (error) throw error;
        res.status(200).json({ ok: true, category: mapCategory(saved) });
        return;
      }

      case 'deleteCategory': {
        const id = String(data.id ?? '');
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        res.status(200).json({ ok: true });
        return;
      }

      case 'upsertPromo': {
        const promo = data.promo as Record<string, unknown>;
        const { data: saved, error } = await supabase
          .from('promos')
          .upsert(promoToRow(promo), { onConflict: 'id' })
          .select('*')
          .single();
        if (error) throw error;
        res.status(200).json({ ok: true, promo: mapPromo(saved) });
        return;
      }

      case 'deletePromo': {
        const id = String(data.id ?? '');
        const { error } = await supabase.from('promos').delete().eq('id', id);
        if (error) throw error;
        res.status(200).json({ ok: true });
        return;
      }

      case 'uploadImage': {
        const productId = String(data.productId ?? '');
        const fileName = String(data.fileName ?? 'image.jpg');
        const contentType = String(data.contentType ?? 'image/jpeg');
        const base64 = String(data.base64 ?? '');
        if (!productId || !base64) {
          badRequest(res, 'productId and base64 are required');
          return;
        }

        const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const buffer = Buffer.from(base64, 'base64');

        const { error } = await supabase.storage
          .from('product-images')
          .upload(path, buffer, { upsert: true, contentType });

        if (error) throw error;

        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
        res.status(200).json({ ok: true, url: urlData.publicUrl, path });
        return;
      }

      default:
        badRequest(res, `Unknown action: ${action}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Admin request failed';
    if (message === 'Admin access required') {
      res.status(403).json({ error: message });
      return;
    }
    if (message === 'Invalid Telegram initData') {
      unauthorized(res, message);
      return;
    }
    serverError(res, err);
  }
}
