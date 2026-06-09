import { getStatusMeta } from './constants.js';

export function parseOrderDate(order) {
  if (order.createdAt) return new Date(order.createdAt);
  return new Date();
}

export function filterOrdersByPeriod(orders, days) {
  if (!days) return orders;
  const from = Date.now() - days * 24 * 60 * 60 * 1000;
  return orders.filter(o => parseOrderDate(o).getTime() >= from);
}

/** Фильтр по датам YYYY-MM-DD (включительно). */
export function filterOrdersByDateRange(orders, dateFrom, dateTo) {
  return orders.filter(o => {
    const key = parseOrderDate(o).toISOString().slice(0, 10);
    if (dateFrom && key < dateFrom) return false;
    if (dateTo && key > dateTo) return false;
    return true;
  });
}

export function buildPeriodReport(orders, dateFrom, dateTo) {
  const list = filterOrdersByDateRange(orders, dateFrom, dateTo);
  const byStatusMap = ordersByStatus(list);
  const delivered = list.filter(o => o.status === 'delivered');
  const deliveredRevenue = delivered.reduce((s, o) => s + (o.totalAmount ?? 0), 0);

  return {
    dateFrom,
    dateTo,
    totalOrders: list.length,
    deliveredCount: delivered.length,
    deliveredRevenue,
    byStatus: byStatusMap,
    orders: list,
  };
}

export function computeSalesStats(orders, days = 30) {
  const list = filterOrdersByPeriod(
    orders.filter(o => o.status !== 'cancelled'),
    days,
  );
  const revenue = list.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
  return {
    orderCount: list.length,
    revenue,
    avgOrder: list.length ? Math.round(revenue / list.length) : 0,
  };
}

export function computePopularProducts(orders, limit = 5) {
  const map = new Map();
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    for (const item of o.items ?? []) {
      const key = item.productId ?? item.name;
      const prev = map.get(key) ?? { name: item.name, qty: 0, revenue: 0 };
      prev.qty += item.qty ?? 1;
      prev.revenue += (item.price ?? 0) * (item.qty ?? 1);
      map.set(key, prev);
    }
  }
  return [...map.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

export function buildCustomersFromOrders(orders) {
  const map = new Map();

  for (const order of orders) {
    const phone = order.customer?.phone ?? order.delivery?.phone ?? '';
    const key = order.customer?.telegramId
      ? `tg:${order.customer.telegramId}`
      : phone || order.customer?.fullName || order.id;

    const existing = map.get(key) ?? {
      id: key,
      fullName: order.customer?.fullName ?? order.delivery?.fullName ?? '—',
      telegramUsername: order.customer?.telegramUsername ?? '',
      telegramId: order.customer?.telegramId ?? null,
      phone: phone || '—',
      orderIds: [],
      orderCount: 0,
      totalSpent: 0,
    };

    existing.orderIds.push(order.id);
    existing.orderCount += 1;
    if (order.status !== 'cancelled') {
      existing.totalSpent += order.totalAmount ?? 0;
    }
    if (order.delivery?.fullName) existing.fullName = order.delivery.fullName;
    if (phone) existing.phone = phone;

    map.set(key, existing);
  }

  return [...map.values()].sort((a, b) => b.orderCount - a.orderCount);
}

export function computeCustomerStats(orders, days = 30) {
  const recent = filterOrdersByPeriod(orders.filter(o => o.status !== 'cancelled'), days);
  const customers = buildCustomersFromOrders(orders);
  const recentPhones = new Set(
    recent.map(o => o.customer?.phone ?? o.delivery?.phone).filter(Boolean),
  );
  const newBuyers = [...recentPhones].filter(phone => {
    const older = orders.filter(o => {
      const p = o.customer?.phone ?? o.delivery?.phone;
      return p === phone && parseOrderDate(o).getTime() < Date.now() - days * 24 * 60 * 60 * 1000;
    });
    return older.length === 0;
  }).length;

  const repeatBuyers = customers.filter(c => c.orderCount > 1).length;

  return {
    totalCustomers: customers.length,
    newBuyers,
    repeatBuyers,
    repeatRate: customers.length
      ? Math.round((repeatBuyers / customers.length) * 100)
      : 0,
  };
}

export function ordersByStatus(orders) {
  return orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});
}

export function statusLabel(id) {
  return getStatusMeta(id).label;
}
