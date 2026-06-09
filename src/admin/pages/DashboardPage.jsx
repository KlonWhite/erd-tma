import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Caps from '../../components/Caps.jsx';
import ListToolbar from '../components/ListToolbar.jsx';
import useAdminStore from '../adminStore.js';
import {
  computeSalesStats,
  computeCustomerStats,
  ordersByStatus,
  filterOrdersByPeriod,
} from '../analytics.js';
import { ORDER_STATUSES, getStatusMeta } from '../constants.js';
import { cmpDate, sortItems } from '../listUtils.js';

const card = {
  background: '#fff',
  border: '1px solid var(--erd-rule)',
  padding: '14px 16px',
};

const PERIOD_FILTERS = [
  { id: '7', label: '7 ДН' },
  { id: '30', label: '30 ДН' },
  { id: '90', label: '90 ДН' },
  { id: 'all', label: 'ВСЁ' },
];

const RECENT_SORT = [
  { value: 'date-desc', label: 'Дата · новые' },
  { value: 'date-asc', label: 'Дата · старые' },
];

const RECENT_SORT_FN = {
  'date-desc': (a, b) => cmpDate(b.createdAt, a.createdAt),
  'date-asc': (a, b) => cmpDate(a.createdAt, b.createdAt),
};

export default function DashboardPage() {
  const orders = useAdminStore(s => s.adminOrders);
  const products = useAdminStore(s => s.catalogProducts);
  const [period, setPeriod] = useState('30');
  const [recentSort, setRecentSort] = useState('date-desc');

  const days = period === 'all' ? null : Number(period);
  const periodOrders = useMemo(() => filterOrdersByPeriod(orders, days), [orders, days]);
  const sales = computeSalesStats(orders, days);
  const customers = computeCustomerStats(orders, days);
  const byStatus = ordersByStatus(periodOrders);

  const recentOrders = useMemo(
    () => sortItems(periodOrders, recentSort, RECENT_SORT_FN).slice(0, 8),
    [periodOrders, recentSort],
  );

  return (
    <div>
      <Caps size={12} weight={800}>ОБЗОР</Caps>

      <ListToolbar
        filters={PERIOD_FILTERS}
        activeFilter={period}
        onFilterChange={setPeriod}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
        <div style={card}>
          <Caps size={9} weight={700} color="var(--erd-muted)">ЗАКАЗЫ</Caps>
          <Caps size={20} weight={800} style={{ display: 'block', marginTop: 6 }}>{sales.orderCount}</Caps>
        </div>
        <div style={card}>
          <Caps size={9} weight={700} color="var(--erd-muted)">ВЫРУЧКА</Caps>
          <Caps size={20} weight={800} style={{ display: 'block', marginTop: 6 }}>{sales.revenue.toLocaleString()} ₽</Caps>
        </div>
        <div style={card}>
          <Caps size={9} weight={700} color="var(--erd-muted)">ТОВАРОВ</Caps>
          <Caps size={20} weight={800} style={{ display: 'block', marginTop: 6 }}>{products.length}</Caps>
        </div>
        <div style={card}>
          <Caps size={9} weight={700} color="var(--erd-muted)">ПОВТОРНЫЕ</Caps>
          <Caps size={20} weight={800} style={{ display: 'block', marginTop: 6 }}>{customers.repeatBuyers}</Caps>
        </div>
      </div>

      <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 20 }}>ПО СТАТУСАМ</Caps>
      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ORDER_STATUSES.map(s => (
          <div key={s.id} style={{ ...card, padding: '8px 12px' }}>
            <Caps size={8} weight={700} color="var(--erd-muted)">{s.label}</Caps>
            <Caps size={14} weight={800} style={{ display: 'block' }}>{byStatus[s.id] ?? 0}</Caps>
          </div>
        ))}
      </div>

      <Caps size={10} weight={800} style={{ display: 'block', marginTop: 20 }}>ПОСЛЕДНИЕ ЗАКАЗЫ</Caps>
      <ListToolbar
        sort={recentSort}
        onSortChange={setRecentSort}
        sortOptions={RECENT_SORT}
        count={recentOrders.length}
        total={periodOrders.length}
      />
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {recentOrders.map(o => {
          const meta = getStatusMeta(o.status);
          return (
            <Link key={o.id} to={`/admin/orders/${encodeURIComponent(o.id)}`} style={{ ...card, padding: '10px 12px', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Caps size={10} weight={800}>{o.id}</Caps>
                <Caps size={9} weight={700} style={{ color: meta.color }}>{meta.label}</Caps>
              </div>
              <Caps size={9} weight={700} color="var(--erd-muted)" style={{ marginTop: 4 }}>
                {(o.totalAmount ?? 0).toLocaleString()} ₽ · {new Date(o.createdAt).toLocaleDateString('ru-RU')}
              </Caps>
            </Link>
          );
        })}
        {recentOrders.length === 0 && (
          <Caps size={10} weight={700} color="var(--erd-muted)">НЕТ ЗАКАЗОВ ЗА ПЕРИОД</Caps>
        )}
      </div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Link to="/admin/orders" style={{ ...card, textDecoration: 'none', color: 'inherit' }}>
          <Caps size={10} weight={800}>ВСЕ ЗАКАЗЫ →</Caps>
        </Link>
        <Link to="/admin/products" style={{ ...card, textDecoration: 'none', color: 'inherit' }}>
          <Caps size={10} weight={800}>КАТАЛОГ →</Caps>
        </Link>
        <Link to="/admin/analytics" style={{ ...card, textDecoration: 'none', color: 'inherit' }}>
          <Caps size={10} weight={800}>АНАЛИТИКА →</Caps>
        </Link>
      </div>
    </div>
  );
}
