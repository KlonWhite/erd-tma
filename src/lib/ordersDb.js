import { getSupabase } from './supabase.js';

function parseItems(itemsJson) {
  if (Array.isArray(itemsJson)) return itemsJson;
  try {
    return JSON.parse(itemsJson ?? '[]');
  } catch {
    return [];
  }
}

/** Статусы бота → отображение в админке */
const ADMIN_STATUS_MAP = {
  pending: 'pending',
  paid: 'pending',
  accepted: 'processing',
  preparing: 'processing',
  shipping: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
  new: 'pending',
  processing: 'processing',
  shipped: 'shipped',
};

const BOT_STATUS_MAP = {
  pending: 'pending',
  processing: 'accepted',
  shipped: 'shipping',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

export function toAdminStatus(status) {
  return ADMIN_STATUS_MAP[status] ?? status ?? 'pending';
}

export function toBotStatus(adminStatus) {
  return BOT_STATUS_MAP[adminStatus] ?? adminStatus ?? 'pending';
}

export function rowToAdminOrder(row) {
  const items = parseItems(row.items_json);
  return {
    id: row.public_id,
    dbId: row.id,
    createdAt: row.created_at,
    status: toAdminStatus(row.status),
    customer: row.customer ?? {
      fullName: row.client_name || 'Гость',
      phone: '',
      telegramId: row.client_telegram_id,
      telegramUsername: '',
    },
    delivery: row.delivery ?? {
      fullName: row.client_name || '',
      address: row.address || '',
      phone: '',
    },
    shipping: row.shipping_detail ?? {
      id: row.shipping,
      name: row.shipping,
      cost: Number(row.shipping_cost) || 0,
    },
    payment: row.payment_detail ?? {
      id: row.payment,
      name: row.payment,
      status: 'paid',
    },
    items,
    subtotal: Number(row.subtotal) || 0,
    shippingCost: Number(row.shipping_cost) || 0,
    totalAmount: Number(row.total) || 0,
    currency: row.currency ?? 'RUB',
    notifications: row.notifications ?? [],
  };
}

export async function fetchAdminOrders() {
  const { data, error } = await getSupabase()
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToAdminOrder);
}

/** Создание заказа из Mini App при оформлении */
export async function createOrderFromCheckout(payload, tgUser) {
  const publicId = payload.orderId || `#ERD-${Date.now().toString().slice(-5)}`;
  const items = payload.items ?? [];

  const row = {
    public_id: publicId,
    client_telegram_id: tgUser?.id ?? payload.customer?.telegramId ?? null,
    client_name: payload.customer?.fullName ?? tgUser?.first_name ?? null,
    status: 'pending',
    shipping: payload.shipping ?? 'pickup',
    address: payload.address ?? payload.delivery?.address ?? '',
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
  return rowToAdminOrder(data);
}

export async function updateOrderInDb(orderId, patch) {
  const { data: existing, error: findError } = await getSupabase()
    .from('orders')
    .select('*')
    .eq('public_id', orderId)
    .maybeSingle();

  if (findError) throw findError;
  if (!existing) throw new Error('Order not found');

  const updates = {};

  if (patch.status != null) {
    updates.status = toBotStatus(patch.status);
  }
  if (patch.totalAmount != null) {
    updates.total = Number(patch.totalAmount);
  }
  if (patch.delivery?.address != null) {
    updates.address = patch.delivery.address;
    updates.delivery = {
      ...(existing.delivery ?? {}),
      ...patch.delivery,
    };
  }
  if (patch.shipping != null) {
    updates.shipping_detail = {
      ...(existing.shipping_detail ?? {}),
      ...patch.shipping,
    };
    if (patch.shipping.id) updates.shipping = patch.shipping.id;
    if (patch.shipping.cost != null) updates.shipping_cost = patch.shipping.cost;
  }
  if (patch.notifications != null) {
    updates.notifications = patch.notifications;
  }

  const { data, error } = await getSupabase()
    .from('orders')
    .update(updates)
    .eq('id', existing.id)
    .select('*')
    .single();

  if (error) throw error;
  return rowToAdminOrder(data);
}
