import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Caps from '../../components/Caps.jsx';
import ListToolbar from '../components/ListToolbar.jsx';
import useAdminStore from '../adminStore.js';
import { buildCustomersFromOrders } from '../analytics.js';
import { downloadCsv } from '../csv.js';
import { cmpNum, cmpStr, matchSearch, sortItems } from '../listUtils.js';

const card = { background: '#fff', border: '1px solid var(--erd-rule)', padding: '12px 14px' };

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Имя A→Z' },
  { value: 'spent-desc', label: 'Сумма ↓' },
  { value: 'spent-asc', label: 'Сумма ↑' },
  { value: 'orders-desc', label: 'Заказов ↓' },
  { value: 'orders-asc', label: 'Заказов ↑' },
];

const CUSTOMER_SORT = {
  'name-asc': (a, b) => cmpStr(a.fullName, b.fullName),
  'spent-desc': (a, b) => cmpNum(b.totalSpent, a.totalSpent),
  'spent-asc': (a, b) => cmpNum(a.totalSpent, b.totalSpent),
  'orders-desc': (a, b) => cmpNum(b.orderCount, a.orderCount),
  'orders-asc': (a, b) => cmpNum(a.orderCount, b.orderCount),
};

export default function CustomersPage() {
  const orders = useAdminStore(s => s.adminOrders);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('spent-desc');
  const [minOrders, setMinOrders] = useState('all');

  const customers = useMemo(() => buildCustomersFromOrders(orders), [orders]);

  const filtered = useMemo(() => {
    let list = customers.filter(c => matchSearch(query, [
      c.fullName,
      c.phone,
      c.telegramUsername,
    ]));
    if (minOrders === '1') list = list.filter(c => c.orderCount >= 1);
    if (minOrders === '2') list = list.filter(c => c.orderCount >= 2);
    return sortItems(list, sort, CUSTOMER_SORT);
  }, [customers, query, sort, minOrders]);

  const exportClients = () => {
    downloadCsv('erd-customers.csv', [
      ['Имя', 'Telegram', 'Телефон', 'Заказов', 'Сумма'],
      ...filtered.map(c => [
        c.fullName,
        c.telegramUsername ? `@${c.telegramUsername}` : '',
        c.phone,
        c.orderCount,
        c.totalSpent,
      ]),
    ]);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Caps size={12} weight={800}>КЛИЕНТЫ</Caps>
        <button type="button" onClick={exportClients} style={{ border: '1px solid var(--erd-ink)', background: 'transparent', padding: '6px 10px', cursor: 'pointer' }}>
          <Caps size={9} weight={700}>CSV</Caps>
        </button>
      </div>

      <ListToolbar
        query={query}
        onQueryChange={setQuery}
        queryPlaceholder="ПОИСК: ИМЯ, ТЕЛЕФОН, @USERNAME"
        sort={sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        filters={[
          { id: 'all', label: 'ВСЕ' },
          { id: '1', label: '1+ ЗАКАЗ' },
          { id: '2', label: 'ПОВТОРНЫЕ' },
        ]}
        activeFilter={minOrders}
        onFilterChange={setMinOrders}
        count={filtered.length}
        total={customers.length}
      />

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(c => (
          <Link key={c.id} to={`/admin/customers/${encodeURIComponent(c.id)}`} style={{ ...card, textDecoration: 'none', color: 'inherit' }}>
            <Caps size={11} weight={800}>{c.fullName}</Caps>
            <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 4 }}>
              {c.telegramUsername ? `@${c.telegramUsername} · ` : ''}{c.phone}
            </Caps>
            <Caps size={10} weight={700} style={{ display: 'block', marginTop: 6 }}>
              {c.orderCount} заказов · {c.totalSpent.toLocaleString()} ₽
            </Caps>
          </Link>
        ))}
        {filtered.length === 0 && (
          <Caps size={10} weight={700} color="var(--erd-muted)">НЕТ КЛИЕНТОВ</Caps>
        )}
      </div>
    </div>
  );
}
