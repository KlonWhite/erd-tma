import { ORDER_STATUSES } from './constants.js';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d.length <= 10 ? `${d}T12:00:00` : d).toLocaleDateString('ru-RU');
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildReportHtml(report) {
  const statusRows = ORDER_STATUSES.map(s => {
    const count = report.byStatus[s.id] ?? 0;
    const pct = report.totalOrders
      ? Math.round((count / report.totalOrders) * 100)
      : 0;
    return `<tr>
      <td>${escapeHtml(s.label)}</td>
      <td style="text-align:center">${count}</td>
      <td style="text-align:right">${pct}%</td>
    </tr>`;
  }).join('');

  const orderRows = (report.orders ?? []).slice(0, 100).map(o => `
    <tr>
      <td>${escapeHtml(o.id)}</td>
      <td>${new Date(o.createdAt).toLocaleDateString('ru-RU')}</td>
      <td>${escapeHtml(ORDER_STATUSES.find(s => s.id === o.status)?.label ?? o.status)}</td>
      <td style="text-align:right">${(o.totalAmount ?? 0).toLocaleString('ru-RU')} ₽</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Отчёт ERD ${fmtDate(report.dateFrom)} — ${fmtDate(report.dateTo)}</title>
  <style>
    body { font-family: -apple-system, sans-serif; padding: 32px; color: #111; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 20px; margin: 0 0 4px; letter-spacing: 0.06em; }
    .sub { color: #666; font-size: 13px; margin-bottom: 24px; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .stat { border: 1px solid #ddd; padding: 14px; }
    .stat h3 { margin: 0 0 6px; font-size: 10px; color: #888; letter-spacing: 0.1em; text-transform: uppercase; }
    .stat p { margin: 0; font-size: 22px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
    th, td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; }
    th { font-size: 10px; text-transform: uppercase; color: #666; letter-spacing: 0.08em; }
    h2 { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #888; margin: 24px 0 8px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>ERD · ОТЧЁТ ПО ЗАКАЗАМ</h1>
  <p class="sub">Период: ${fmtDate(report.dateFrom)} — ${fmtDate(report.dateTo)} · сформирован ${new Date().toLocaleString('ru-RU')}</p>

  <div class="stats">
    <div class="stat">
      <h3>Всего заказов</h3>
      <p>${report.totalOrders}</p>
    </div>
    <div class="stat">
      <h3>Выручка (доставлено)</h3>
      <p>${report.deliveredRevenue.toLocaleString('ru-RU')} ₽</p>
    </div>
    <div class="stat">
      <h3>Доставлено заказов</h3>
      <p>${report.deliveredCount}</p>
    </div>
  </div>

  <h2>Распределение по статусам</h2>
  <table>
    <thead><tr><th>Статус</th><th style="text-align:center">Кол-во</th><th style="text-align:right">Доля</th></tr></thead>
    <tbody>${statusRows}</tbody>
  </table>

  <h2>Заказы за период</h2>
  <table>
    <thead><tr><th>ID</th><th>Дата</th><th>Статус</th><th style="text-align:right">Сумма</th></tr></thead>
    <tbody>${orderRows || '<tr><td colspan="4">Нет заказов</td></tr>'}</tbody>
  </table>
  ${(report.orders?.length ?? 0) > 100 ? '<p style="color:#999;font-size:12px">Показаны первые 100 заказов</p>' : ''}
</body>
</html>`;
}

export function openReportPrint(report, { print = false } = {}) {
  const html = buildReportHtml(report);
  const win = window.open('', '_blank');
  if (!win) {
    alert('Разрешите всплывающие окна для отчёта');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  if (print) {
    win.onload = () => win.print();
    setTimeout(() => win.print(), 300);
  }
}
