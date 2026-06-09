import { getSupabase } from './supabaseClient.js';
import { PENDING_STATUSES, STATUS, getNextStatus, isActiveStatus } from './orderStatus.js';

function mapOrder(row) {
  if (!row) return null;
  return {
    ...row,
    items_json: typeof row.items_json === 'string'
      ? row.items_json
      : JSON.stringify(row.items_json ?? []),
  };
}

export async function createOrderFromPayload(payload, from) {
  const publicId = payload.orderId || `#ERD-${Date.now().toString().slice(-5)}`;
  const items = payload.items ?? [];

  const row = {
    public_id: publicId,
    client_telegram_id: from?.id ?? null,
    client_name: from?.first_name ?? payload.customer?.fullName ?? null,
    status: STATUS.PENDING,
    shipping: payload.shipping ?? 'pickup',
    address: payload.address ?? '',
    coords: payload.coords ?? null,
    subtotal: payload.subtotal ?? 0,
    discount: payload.discount ?? 0,
    shipping_cost: payload.shippingCost ?? 0,
    total: payload.total ?? 0,
    currency: payload.currency ?? 'RUB',
    promo_code: payload.promoCode ?? null,
    items_json: items,
    payment: payload.payment ?? 'demo',
    customer: payload.customer ?? null,
    delivery: payload.delivery ?? null,
    shipping_detail: payload.shippingDetail ?? null,
    payment_detail: payload.paymentDetail ?? null,
    notifications: [],
  };

  const { data, error } = await getSupabase()
    .from('orders')
    .insert(row)
    .select('*')
    .single();

  if (error) throw error;
  return mapOrder(data);
}

export async function getOrder(id) {
  const { data, error } = await getSupabase()
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return mapOrder(data);
}

export async function getOrderByPublicId(publicId) {
  const { data, error } = await getSupabase()
    .from('orders')
    .select('*')
    .eq('public_id', publicId)
    .maybeSingle();

  if (error) throw error;
  return mapOrder(data);
}

export async function getPendingOrders() {
  const { data, error } = await getSupabase()
    .from('orders')
    .select('*')
    .in('status', PENDING_STATUSES)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

/** @deprecated use getPendingOrders */
export async function getPaidOrders() {
  return getPendingOrders();
}

export async function getMyActiveOrders(adminTelegramId) {
  const { data, error } = await getSupabase()
    .from('orders')
    .select('*')
    .eq('assigned_admin_id', adminTelegramId)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? [])
    .filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
    .map(mapOrder);
}

export async function acceptOrder(orderId, adminTelegramId) {
  const { data, error } = await getSupabase()
    .from('orders')
    .update({
      status: STATUS.ACCEPTED,
      assigned_admin_id: adminTelegramId,
    })
    .eq('id', orderId)
    .select('*')
    .single();

  if (error) throw error;
  return mapOrder(data);
}

export async function advanceOrderStatus(orderId, adminTelegramId) {
  const order = await getOrder(orderId);
  if (!order) return null;

  const next = getNextStatus(order);
  if (!next || next === STATUS.ACCEPTED) return null;

  if (order.assigned_admin_id && order.assigned_admin_id !== adminTelegramId) {
    return { error: 'assigned_other' };
  }

  const { data, error } = await getSupabase()
    .from('orders')
    .update({
      status: next,
      assigned_admin_id: adminTelegramId,
    })
    .eq('id', orderId)
    .select('*')
    .single();

  if (error) throw error;
  return mapOrder(data);
}

export function parseOrderItems(order) {
  try {
    const raw = order.items_json;
    if (Array.isArray(raw)) return raw;
    return JSON.parse(raw ?? '[]');
  } catch {
    return [];
  }
}

export async function acceptFirstPendingForAdmin(adminTelegramId) {
  const pending = await getPendingOrders();
  if (!pending.length) return null;
  return acceptOrder(pending[0].id, adminTelegramId);
}

export async function seedDemoOrders(adminTelegramId = null) {
  const pending = await getPendingOrders();
  if (pending.length > 0) {
    if (adminTelegramId) {
      const accepted = await acceptFirstPendingForAdmin(adminTelegramId);
      return { created: 0, skipped: true, accepted };
    }
    return { created: 0, skipped: true };
  }

  const demos = [
    {
      public_id: '#ERD-DEMO-1',
      shipping: 'pickup',
      address: 'Москва, ул. Тверская, 15 · showroom ERD',
      total: 8888,
      items_json: [{ name: 'ХУДИ ЭКС-ТРЕНЕР', size: 'M', qty: 1, price: 8888 }],
    },
    {
      public_id: '#ERD-DEMO-2',
      shipping: 'courier',
      address: 'Москва, ул. Арбат, 10, кв. 5',
      total: 9678,
      shipping_cost: 790,
      items_json: [{ name: 'ФУТБОЛКА COWBOYS', size: 'L', qty: 1, price: 8888 }],
    },
  ];

  for (const d of demos) {
    const { error } = await getSupabase().from('orders').insert({
      public_id: d.public_id,
      client_telegram_id: null,
      client_name: 'Демо-клиент',
      status: STATUS.PENDING,
      shipping: d.shipping,
      address: d.address,
      subtotal: d.total,
      discount: 0,
      shipping_cost: d.shipping_cost ?? 0,
      total: d.total,
      currency: 'RUB',
      promo_code: null,
      items_json: d.items_json,
      payment: 'demo',
      notifications: [],
    });
    if (error) throw error;
  }

  let accepted = null;
  if (adminTelegramId) {
    accepted = await acceptFirstPendingForAdmin(adminTelegramId);
  }
  return { created: demos.length, skipped: false, accepted };
}

export { isActiveStatus, getNextStatus };
