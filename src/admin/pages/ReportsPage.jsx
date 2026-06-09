import { useMemo, useState } from 'react';
import Caps from '../../components/Caps.jsx';
import useAdminStore from '../adminStore.js';
import { ORDER_STATUSES } from '../constants.js';
import { buildPeriodReport } from '../analytics.js';
import { openReportPrint } from '../reports.js';

const card = {
  background: '#fff',
  border: '1px solid var(--erd-rule)',
  padding: '14px 16px',
};

function defaultDateTo() {
  return new Date().toISOString().slice(0, 10);
}

function defaultDateFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const orders = useAdminStore(s => s.adminOrders);
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);
  const [generated, setGenerated] = useState(false);

  const report = useMemo(() => {
    if (!generated) return null;
    return buildPeriodReport(orders, dateFrom, dateTo);
  }, [orders, dateFrom, dateTo, generated]);

  const generate = () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      alert('Дата «от» не может быть позже даты «до»');
      return;
    }
    setGenerated(true);
  };

  const btn = {
    border: '1px solid var(--erd-ink)',
    background: 'var(--erd-ink)',
    color: '#fff',
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.06em',
  };

  const btnOutline = { ...btn, background: '#fff', color: 'var(--erd-ink)' };

  return (
    <div>
      <Caps size={12} weight={800}>ОТЧЁТЫ</Caps>
      <Caps size={9} weight={600} color="var(--erd-muted)" style={{ display: 'block', marginTop: 6 }}>
        Детализированный отчёт по заказам за период
      </Caps>

      <div style={{ ...card, marginTop: 14 }}>
        <Caps size={9} weight={700} color="var(--erd-muted)">ПЕРИОД</Caps>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          <label style={{ flex: 1, minWidth: 130 }}>
            <Caps size={8} weight={700} color="var(--erd-muted)">ДАТА ОТ</Caps>
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setGenerated(false); }}
              style={{ width: '100%', marginTop: 4, padding: '8px 0', border: 'none', borderBottom: '1px solid var(--erd-ink)', fontWeight: 700, fontSize: 12 }}
            />
          </label>
          <label style={{ flex: 1, minWidth: 130 }}>
            <Caps size={8} weight={700} color="var(--erd-muted)">ДАТА ДО</Caps>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setGenerated(false); }}
              style={{ width: '100%', marginTop: 4, padding: '8px 0', border: 'none', borderBottom: '1px solid var(--erd-ink)', fontWeight: 700, fontSize: 12 }}
            />
          </label>
        </div>
        <button type="button" onClick={generate} style={{ ...btn, marginTop: 16, width: '100%' }}>
          <Caps size={10} weight={800}>СФОРМИРОВАТЬ ОТЧЁТ</Caps>
        </button>
      </div>

      {report && (
        <>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button type="button" style={btnOutline} onClick={() => openReportPrint(report)}>
              <Caps size={9} weight={700}>ОТКРЫТЬ HTML</Caps>
            </button>
            <button type="button" style={btn} onClick={() => openReportPrint(report, { print: true })}>
              <Caps size={9} weight={700}>ПЕЧАТЬ</Caps>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
            <div style={card}>
              <Caps size={9} weight={700} color="var(--erd-muted)">ВСЕГО ЗАКАЗОВ</Caps>
              <Caps size={22} weight={800} style={{ display: 'block', marginTop: 6 }}>{report.totalOrders}</Caps>
            </div>
            <div style={card}>
              <Caps size={9} weight={700} color="var(--erd-muted)">ВЫРУЧКА · ДОСТАВЛЕНО</Caps>
              <Caps size={22} weight={800} style={{ display: 'block', marginTop: 6 }}>
                {report.deliveredRevenue.toLocaleString('ru-RU')} ₽
              </Caps>
              <Caps size={8} weight={600} color="var(--erd-muted)" style={{ display: 'block', marginTop: 4 }}>
                {report.deliveredCount} заказов со статусом «Доставлен»
              </Caps>
            </div>
          </div>

          <Caps size={10} weight={800} style={{ display: 'block', marginTop: 20 }}>ПО СТАТУСАМ</Caps>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ORDER_STATUSES.map(s => {
              const count = report.byStatus[s.id] ?? 0;
              const pct = report.totalOrders
                ? Math.round((count / report.totalOrders) * 100)
                : 0;
              return (
                <div key={s.id} style={{ ...card, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Caps size={10} weight={800} style={{ color: s.color }}>{s.label}</Caps>
                  <div style={{ textAlign: 'right' }}>
                    <Caps size={14} weight={800}>{count}</Caps>
                    <Caps size={8} weight={600} color="var(--erd-muted)" style={{ display: 'block' }}>{pct}%</Caps>
                  </div>
                </div>
              );
            })}
          </div>

          {report.totalOrders === 0 && (
            <Caps size={10} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 16 }}>
              За выбранный период заказов нет
            </Caps>
          )}
        </>
      )}
    </div>
  );
}
