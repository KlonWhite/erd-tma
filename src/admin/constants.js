export const ORDER_STATUSES = [
  { id: 'pending', label: 'НОВЫЙ', color: 'var(--erd-ox)' },
  { id: 'processing', label: 'В ОБРАБОТКЕ', color: '#8a6a00' },
  { id: 'shipped', label: 'ОТПРАВЛЕН', color: '#1a5a8a' },
  { id: 'delivered', label: 'ДОСТАВЛЕН', color: '#2a6a3a' },
  { id: 'cancelled', label: 'ОТМЕНЁН', color: 'var(--erd-muted)' },
];

export const DEFAULT_CATEGORIES = [
  { id: 'cat-men', name: 'Мужская одежда', slug: 'men' },
  { id: 'cat-women', name: 'Женская одежда', slug: 'women' },
  { id: 'cat-kids', name: 'Детская одежда', slug: 'kids' },
  { id: 'cat-accessories', name: 'Аксессуары', slug: 'accessories' },
];

export function getStatusMeta(id) {
  return ORDER_STATUSES.find(s => s.id === id) ?? ORDER_STATUSES[0];
}

export const SHIPPING_TYPES = [
  { id: 'pickup', name: 'САМОВЫВОЗ' },
  { id: 'courier', name: 'КУРЬЕРСКАЯ ДОСТАВКА' },
  { id: 'postal', name: 'ПОЧТОВАЯ ДОСТАВКА' },
];

export function getShippingTypeMeta(id) {
  return SHIPPING_TYPES.find(s => s.id === id) ?? SHIPPING_TYPES[0];
}

export const ADMIN_NAV = [
  { path: '/admin', label: 'ОБЗОР', end: true },
  { path: '/admin/orders', label: 'ЗАКАЗЫ' },
  { path: '/admin/products', label: 'ТОВАРЫ' },
  { path: '/admin/categories', label: 'КАТЕГОРИИ' },
  { path: '/admin/promos', label: 'ПРОМО' },
  { path: '/admin/customers', label: 'КЛИЕНТЫ' },
  { path: '/admin/analytics', label: 'АНАЛИТИКА' },
  { path: '/admin/reports', label: 'ОТЧЁТЫ' },
];
