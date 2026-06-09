import { createOrderFromPayload, getOrderByPublicId } from '../orders.js';
import { notifyAdminsNewOrder } from '../notifications.js';

export async function handleWebAppData(ctx, bot) {
  const raw = ctx.message?.web_app_data?.data;
  if (!raw) return false;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    console.warn('[bot] invalid web_app_data JSON');
    return false;
  }

  if (payload.type !== 'erd_order') return false;

  // Заказ мог быть уже сохранён в Supabase из Mini App
  let order = payload.orderId
    ? await getOrderByPublicId(payload.orderId)
    : null;

  if (!order) {
    order = await createOrderFromPayload(payload, ctx.from);
  }

  const alreadyNotified = (order.notifications ?? []).some((n) => n.event === 'order_created');

  if (!alreadyNotified) {
    await notifyAdminsNewOrder(bot, order);
    await ctx.reply(
      `✅ Заказ <b>${order.public_id}</b> принят.\nМы свяжемся с вами в ближайшее время.`,
      { parse_mode: 'HTML' },
    );
  } else {
    await ctx.reply(
      `✅ Заказ <b>${order.public_id}</b> уже оформлен.`,
      { parse_mode: 'HTML' },
    );
  }

  return true;
}
