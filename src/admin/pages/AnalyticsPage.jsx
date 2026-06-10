import { useMemo, useState } from 'react';
import Caps from '../../components/Caps.jsx';
import ListToolbar from '../components/ListToolbar.jsx';
import useAdminStore from '../adminStore.js';
import {
  computeSalesStats,
  computePopularProducts,
  computeCustomerStats,
  filterOrdersByPeriod,
} from '../analytics.js';

const card = { background: '#fff', border: '1px solid var(--erd-rule)', padding: '14px 16px' };

const PERIOD_FILTERS = [
  { id: '7', label: '7 ДН' },
  { id: '30', label: '30 ДН' },
  { id: '90', label: '90 ДН' },
  { id: 'all', label: 'ВСЁ' },
];

const POPULAR_SORT = [
  { value: 'qty-desc', label: 'Кол-во ↓' },
  { value: 'revenue-desc', label: 'Выручка ↓' },
  { value: 'name-asc', label: 'Название A→Z' },
];

export default function AnalyticsPage() {
  const orders = useAdminStore(s => s.adminOrders);
  const [period, setPeriod] = useState('30');
  const [popularSort, setPopularSort] = useState('qty-desc');

  const days = period === 'all' ? null : Number(period);
  const periodOrders = filterOrdersByPeriod(orders, days);
  const sales = computeSalesStats(orders, days);
  const customers = computeCustomerStats(orders, days);

  const popularRaw = computePopularProducts(periodOrders, 50);

  const popular = useMemo(() => {
    const list = [...popularRaw];
    if (popularSort === 'qty-desc') list.sort((a, b) => b.qty - a.qty);
    else if (popularSort === 'revenue-desc') list.sort((a, b) => b.revenue - a.revenue);
    else list.sort((a, b) => String(a.name).localeCompare(String(b.name), 'ru'));
    return list.slice(0, 12);
  }, [popularRaw, popularSort]);

  return (
    <div>
      <Caps size={12} weight={800}>АНАЛИТИКА</Caps>

      <ListToolbar
        filters={PERIOD_FILTERS}
        activeFilter={period}
        onFilterChange={setPeriod}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
        <div style={card}>
          <Caps size={9} weight={700} color="var(--erd-muted)">ЗАКАЗОВ</Caps>
          <Caps size={18} weight={800} style={{ display: 'block', marginTop: 4 }}>{sales.orderCount}</Caps>
        </div>
        <div style={card}>
          <Caps size={9} weight={700} color="var(--erd-muted)">ВЫРУЧКА</Caps>
          <Caps size={18} weight={800} style={{ display: 'block', marginTop: 4 }}>{sales.revenue.toLocaleString()} ₽</Caps>
        </div>
        <div style={card}>
          <Caps size={9} weight={700} color="var(--erd-muted)">СРЕДНИЙ ЧЕК</Caps>
          <Caps size={18} weight={800} style={{ display: 'block', marginTop: 4 }}>{sales.avgOrder.toLocaleString()} ₽</Caps>
        </div>
        <div style={card}>
          <Caps size={9} weight={700} color="var(--erd-muted)">ПОВТОРНЫЕ</Caps>
          <Caps size={18} weight={800} style={{ display: 'block', marginTop: 4 }}>{customers.repeatBuyers}</Caps>
        </div>
      </div>

      <Caps size={10} weight={800} style={{ display: 'block', marginTop: 20 }}>КЛИЕНТЫ</Caps>
      <div style={{ ...card, marginTop: 8 }}>
        <Caps size={9} weight={700} color="var(--erd-muted)">ВСЕГО КЛИЕНТОВ</Caps>
        <Caps size={14} weight={800} style={{ display: 'block', marginTop: 4 }}>{customers.totalCustomers}</Caps>
        <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 10 }}>НОВЫЕ ЗА ПЕРИОД</Caps>
        <Caps size={14} weight={800} style={{ display: 'block', marginTop: 4 }}>{customers.newBuyers}</Caps>
        <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 10 }}>ДОЛЯ ПОВТОРНЫХ</Caps>
        <Caps size={14} weight={800} style={{ display: 'block', marginTop: 4 }}>{customers.repeatRate}%</Caps>
      </div>

      <Caps size={10} weight={800} style={{ display: 'block', marginTop: 20 }}>ПОПУЛЯРНЫЕ ТОВАРЫ</Caps>
      <ListToolbar
        sort={popularSort}
        onSortChange={setPopularSort}
        sortOptions={POPULAR_SORT}
        count={popular.length}
        total={popularRaw.length}
      />
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {popular.map((p, i) => (
          <div key={i} style={{ ...card, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Caps size={10} weight={800}>{p.name}</Caps>
              <Caps size={10} weight={700}>{p.qty} шт.</Caps>
            </div>
            <Caps size={9} weight={700} color="var(--erd-muted)">{p.revenue.toLocaleString()} ₽</Caps>
          </div>
        ))}
        {popular.length === 0 && <Caps size={10} weight={700} color="var(--erd-muted)">НЕТ ДАННЫХ</Caps>}
      </div>
    </div>
  );
}
