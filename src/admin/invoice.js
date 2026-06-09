import { getStatusMeta } from './constants.js';

function fmtMoney(n, currency = 'RUB') {
  const suffix = currency === 'RUB' ? '₽' : currency;
  return `${(Number(n) || 0).toLocaleString('ru-RU')} ${suffix}`;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildInvoiceHtml(order) {
  const status = getStatusMeta(order.status);
  const items = order.items ?? [];
  const rows = items.map(i => `
    <tr>
      <td>${escapeHtml(i.name)}${i.size ? ` (${escapeHtml(i.size)})` : ''}</td>
      <td style="text-align:center">${i.qty ?? 1}</td>
      <td style="text-align:right">${fmtMoney((i.price ?? 0) * (i.qty ?? 1), order.currency)}</td>
    </tr>
  `).join('');

  const created = new Date(order.createdAt).toLocaleString('ru-RU');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Счёт ${escapeHtml(order.id)} — ERD</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 32px; color: #111; background: #fff; }
    h1 { font-size: 22px; margin: 0 0 4px; letter-spacing: 0.04em; }
    .sub { color: #666; font-size: 13px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .box { border: 1px solid #ddd; padding: 12px 14px; }
    .box h3 { margin: 0 0 8px; font-size: 10px; letter-spacing: 0.12em; color: #888; text-transform: uppercase; }
    .box p { margin: 0; font-size: 13px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border-bottom: 1px solid #eee; padding: 10px 8px; font-size: 13px; text-align: left; }
    th { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #666; }
    .total { margin-top: 16px; text-align: right; font-size: 18px; font-weight: 700; }
    .status { display: inline-block; margin-top: 8px; padding: 4px 10px; border: 1px solid #111; font-size: 11px; letter-spacing: 0.08em; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>ERD · СЧЁТ</h1>
  <p class="sub">Заказ ${escapeHtml(order.id)} · ${created}</p>

  <div class="grid">
    <div class="box">
      <h3>Покупатель</h3>
      <p>${escapeHtml(order.delivery?.fullName || order.customer?.fullName || '—')}<br />
      ${escapeHtml(order.delivery?.phone || order.customer?.phone || '')}<br />
      ${order.customer?.telegramUsername ? `@${escapeHtml(order.customer.telegramUsername)}` : ''}</p>
    </div>
    <div class="box">
      <h3>Доставка</h3>
      <p>${escapeHtml(order.shipping?.name || '—')}<br />
      ${escapeHtml(order.delivery?.address || '—')}</p>
      <span class="status">${escapeHtml(status.label)}</span>
    </div>
  </div>

  <h3 style="font-size:10px;letter-spacing:0.12em;color:#888;text-transform:uppercase;margin:0 0 8px">Состав заказа</h3>
  <table>
    <thead>
      <tr><th>Товар</th><th style="text-align:center">Кол-во</th><th style="text-align:right">Сумма</th></tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="3">—</td></tr>'}
    </tbody>
  </table>

  ${order.subtotal != null ? `<p style="text-align:right;margin-top:12px;font-size:13px;color:#666">Подытог: ${fmtMoney(order.subtotal, order.currency)}</p>` : ''}
  ${order.shippingCost ? `<p style="text-align:right;margin:4px 0;font-size:13px;color:#666">Доставка: ${fmtMoney(order.shippingCost, order.currency)}</p>` : ''}
  <p class="total">Итого: ${fmtMoney(order.totalAmount, order.currency)}</p>
  <p style="margin-top:32px;font-size:11px;color:#999">Оплата: ${escapeHtml(order.payment?.name || '—')}</p>
</body>
</html>`;
}

/** @param {object} order @param {{ print?: boolean }} opts */
export function openInvoice(order, { print = false } = {}) {
  const html = buildInvoiceHtml(order);
  const win = window.open('', '_blank');
  if (!win) {
    alert('Разрешите всплывающие окна для формирования счёта');
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
