import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Caps from '../../components/Caps.jsx';
import ListToolbar from '../components/ListToolbar.jsx';
import useAdminStore from '../adminStore.js';
import { buildCustomersFromOrders } from '../analytics.js';
import { ORDER_STATUSES, getStatusMeta } from '../constants.js';
import { cmpDate, cmpNum, sortItems } from '../listUtils.js';

const card = { background: '#fff', border: '1px solid var(--erd-rule)', padding: '12px 14px', marginBottom: 8 };

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Дата · новые' },
  { value: 'date-asc', label: 'Дата · старые' },
  { value: 'total-desc', label: 'Сумма ↓' },
  { value: 'total-asc', label: 'Сумма ↑' },
];

const ORDER_SORT = {
  'date-desc': (a, b) => cmpDate(b.createdAt, a.createdAt),
  'date-asc': (a, b) => cmpDate(a.createdAt, b.createdAt),
  'total-desc': (a, b) => cmpNum(b.totalAmount, a.totalAmount),
  'total-asc': (a, b) => cmpNum(a.totalAmount, b.totalAmount),
};

export default function CustomerDetailPage() {
  const { customerId } = useParams();
  const orders = useAdminStore(s => s.adminOrders);
  const id = decodeURIComponent(customerId ?? '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('date-desc');

  const customer = useMemo(
    () => buildCustomersFromOrders(orders).find(c => c.id === id),
    [orders, id],
  );

  const customerOrders = useMemo(() => {
    if (!customer) return [];
    let list = orders.filter(o => customer.orderIds.includes(o.id));
    if (statusFilter !== 'all') list = list.filter(o => o.status === statusFilter);
    return sortItems(list, sort, ORDER_SORT);
  }, [orders, customer, statusFilter, sort]);

  if (!customer) {
    return (
      <div>
        <Caps size={11} weight={700}>КЛИЕНТ НЕ НАЙДЕН</Caps>
        <Link to="/admin/customers"><Caps size={10} weight={700}>← НАЗАД</Caps></Link>
      </div>
    );
  }

  const statusFilters = [
    { id: 'all', label: 'ВСЕ' },
    ...ORDER_STATUSES.map(s => ({ id: s.id, label: s.label })),
  ];

  return (
    <div>
      <Link to="/admin/customers"><Caps size={10} weight={700} color="var(--erd-muted)">← КЛИЕНТЫ</Caps></Link>
      <Caps size={14} weight={800} style={{ display: 'block', marginTop: 10 }}>{customer.fullName}</Caps>
      <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 6 }}>
        {customer.telegramUsername ? `@${customer.telegramUsername} · ` : ''}{customer.phone}
      </Caps>

      <div style={{ ...card, marginTop: 14 }}>
        <Caps size={9} weight={700} color="var(--erd-muted)">СТАТИСТИКА</Caps>
        <Caps size={11} weight={800} style={{ display: 'block', marginTop: 6 }}>
          {customer.orderCount} заказов · {customer.totalSpent.toLocaleString()} ₽
        </Caps>
      </div>

      <Caps size={10} weight={800} style={{ display: 'block', marginTop: 16 }}>ИСТОРИЯ ЗАКАЗОВ</Caps>

      <ListToolbar
        sort={sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        filters={statusFilters}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        count={customerOrders.length}
        total={customer.orderIds.length}
      />

      {customerOrders.map(o => {
        const meta = getStatusMeta(o.status);
        return (
          <Link key={o.id} to={`/admin/orders/${encodeURIComponent(o.id)}`} style={{ ...card, display: 'block', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Caps size={10} weight={800}>{o.id}</Caps>
              <Caps size={9} weight={700} style={{ color: meta.color }}>{meta.label}</Caps>
            </div>
            <Caps size={9} weight={700} color="var(--erd-muted)" style={{ marginTop: 4 }}>
              {new Date(o.createdAt).toLocaleDateString('ru-RU')} · {(o.totalAmount ?? 0).toLocaleString()} ₽
            </Caps>
          </Link>
        );
      })}
      {customerOrders.length === 0 && (
        <Caps size={10} weight={700} color="var(--erd-muted)">НЕТ ЗАКАЗОВ</Caps>
      )}
    </div>
  );
}
