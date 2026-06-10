import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Caps from '../../components/Caps.jsx';
import ListToolbar from '../components/ListToolbar.jsx';
import useAdminStore from '../adminStore.js';
import { ORDER_STATUSES, getShippingTypeMeta, getStatusMeta } from '../constants.js';
import { openInvoice } from '../invoice.js';
import { downloadCsv } from '../csv.js';
import { statusLabel } from '../analytics.js';
import { cmpDate, matchSearch, sortItems } from '../listUtils.js';

const th = {
  padding: '8px 6px',
  textAlign: 'left',
  borderBottom: '2px solid var(--erd-ink)',
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: '0.06em',
  whiteSpace: 'nowrap',
};

const td = {
  padding: '10px 6px',
  borderBottom: '1px solid var(--erd-rule)',
  fontSize: 11,
  fontWeight: 700,
  verticalAlign: 'top',
};

const btnSm = {
  border: '1px solid var(--erd-rule)',
  background: '#fff',
  padding: '4px 6px',
  cursor: 'pointer',
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
};

function orderItemsText(order) {
  return (order.items ?? [])
    .map(i => `${i.name ?? ''} ${i.size ?? ''} x${i.qty ?? 1}`)
    .join(' ');
}

function orderDateKey(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

export default function OrdersPage() {
  const orders = useAdminStore(s => s.adminOrders);
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    let list = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

    list = list.filter(o => matchSearch(query, [
      o.id,
      o.delivery?.address,
      o.delivery?.fullName,
      orderItemsText(o),
    ]));

    if (dateFrom) {
      list = list.filter(o => orderDateKey(o.createdAt) >= dateFrom);
    }
    if (dateTo) {
      list = list.filter(o => orderDateKey(o.createdAt) <= dateTo);
    }

    return sortItems(list, 'date-desc', {
      'date-desc': (a, b) => cmpDate(b.createdAt, a.createdAt),
    });
  }, [orders, statusFilter, query, dateFrom, dateTo]);

  const exportOrders = () => {
    downloadCsv('erd-orders.csv', [
      ['ID', 'Дата', 'Статус', 'Адрес', 'Тип', 'Сумма', 'Состав'],
      ...filtered.map(o => [
        o.id,
        new Date(o.createdAt).toLocaleString('ru-RU'),
        statusLabel(o.status),
        o.delivery?.address ?? '',
        o.shipping?.name ?? '',
        o.totalAmount,
        orderItemsText(o),
      ]),
    ]);
  };

  const statusFilters = [
    { id: 'all', label: 'ВСЕ' },
    ...ORDER_STATUSES.map(s => ({ id: s.id, label: s.label })),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Caps size={12} weight={800}>ЗАКАЗЫ</Caps>
        <button type="button" onClick={exportOrders} style={{ border: '1px solid var(--erd-ink)', background: 'transparent', padding: '6px 10px', cursor: 'pointer' }}>
          <Caps size={9} weight={700}>CSV</Caps>
        </button>
      </div>

      <ListToolbar
        query={query}
        onQueryChange={setQuery}
        queryPlaceholder="ПОИСК: ID, АДРЕС, СОСТАВ"
        filters={statusFilters}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        count={filtered.length}
        total={orders.length}
      />

      <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        <label style={{ flex: 1, minWidth: 120 }}>
          <Caps size={8} weight={700} color="var(--erd-muted)">ДАТА ОТ</Caps>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', marginTop: 4, padding: '8px 0', border: 'none', borderBottom: '1px solid var(--erd-rule)', fontWeight: 700, fontSize: 12 }} />
        </label>
        <label style={{ flex: 1, minWidth: 120 }}>
          <Caps size={8} weight={700} color="var(--erd-muted)">ДАТА ДО</Caps>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', marginTop: 4, padding: '8px 0', border: 'none', borderBottom: '1px solid var(--erd-rule)', fontWeight: 700, fontSize: 12 }} />
        </label>
        {(dateFrom || dateTo) && (
          <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ alignSelf: 'flex-end', ...btnSm }}>
            СБРОС ДАТ
          </button>
        )}
      </div>

      <div style={{ marginTop: 14, overflowX: 'auto', background: '#fff', border: '1px solid var(--erd-rule)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>ДАТА</th>
              <th style={th}>СТАТУС</th>
              <th style={th}>АДРЕС</th>
              <th style={th}>ТИП</th>
              <th style={{ ...th, textAlign: 'right' }}>СУММА</th>
              <th style={th}>ДЕЙСТВИЯ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => {
              const meta = getStatusMeta(o.status);
              const ship = getShippingTypeMeta(o.shipping?.id);
              return (
                <tr key={o.id}>
                  <td style={td}>
                    <Link to={`/admin/orders/${encodeURIComponent(o.id)}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                      {o.id}
                    </Link>
                  </td>
                  <td style={td}>{new Date(o.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td style={{ ...td, color: meta.color }}>{meta.label}</td>
                  <td style={{ ...td, maxWidth: 140, lineHeight: 1.35 }}>{o.delivery?.address || '—'}</td>
                  <td style={td}>{ship.name}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{(o.totalAmount ?? 0).toLocaleString()} ₽</td>
                  <td style={td}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Link to={`/admin/orders/${encodeURIComponent(o.id)}`} style={{ ...btnSm, textDecoration: 'none', color: 'inherit', textAlign: 'center' }}>ИЗМ.</Link>
                      <button type="button" style={btnSm} onClick={() => openInvoice(o)}>СЧЁТ</button>
                      <button type="button" style={btnSm} onClick={() => openInvoice(o, { print: true })}>ПЕЧАТЬ</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <Caps size={10} weight={700} color="var(--erd-muted)" style={{ display: 'block', padding: 16 }}>НЕТ ЗАКАЗОВ</Caps>
        )}
      </div>
    </div>
  );
}
