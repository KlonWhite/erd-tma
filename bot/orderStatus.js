/** Статусы и переходы по ТЗ (адаптировано под ERD). */

export const STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
};

/** Старые заказы могли быть с status=paid */
export const PENDING_STATUSES = [STATUS.PENDING, 'paid'];

const FLOW = {
  courier: [STATUS.PENDING, STATUS.ACCEPTED, STATUS.PREPARING, STATUS.SHIPPING, STATUS.DELIVERED],
  postal: [STATUS.PENDING, STATUS.ACCEPTED, STATUS.PREPARING, STATUS.SHIPPING, STATUS.DELIVERED],
  pickup: [STATUS.PENDING, STATUS.ACCEPTED, STATUS.PREPARING, STATUS.DELIVERED],
};

export const STATUS_LABEL = {
  pending: '⏳ Ожидает принятия',
  paid: '⏳ Ожидает принятия',
  accepted: '✅ Принят',
  preparing: '📦 На сборке',
  shipping: '🚚 В доставке',
  delivered: '✅ Выполнен',
};

export const NEXT_ACTION = {
  accepted: '✅ Принять заказ',
  preparing: '📦 Начать сборку',
  shipping: '🚚 В доставку',
  delivered: '✅ Доставлен',
};

export const CLIENT_NOTIFY = {
  accepted: id => `✅ Ваш заказ #${id} принят! Скоро начнём сборку.`,
  preparing: id => `📦 Заказ #${id}: начата сборка.`,
  shipping: id => `🚚 Заказ #${id} передан в доставку.`,
  delivered: id => `✅ Заказ #${id} выполнен. Спасибо за покупку в ERD!`,
};

export function getStatusFlow(shipping) {
  return FLOW[shipping] ?? FLOW.courier;
}

export function getNextStatus(order) {
  const flow = getStatusFlow(order.shipping);
  const current = PENDING_STATUSES.includes(order.status) ? STATUS.PENDING : order.status;
  const idx = flow.indexOf(current);
  if (idx < 0 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

export function canAccept(order) {
  return PENDING_STATUSES.includes(order.status);
}

export function isActiveStatus(status) {
  return status !== STATUS.DELIVERED && status !== 'cancelled';
}
