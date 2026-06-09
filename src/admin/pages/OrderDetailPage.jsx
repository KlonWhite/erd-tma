import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Caps from '../../components/Caps.jsx';
import useAdminStore from '../adminStore.js';
import { ORDER_STATUSES, SHIPPING_TYPES, getStatusMeta } from '../constants.js';
import { openInvoice } from '../invoice.js';

const card = { background: '#fff', border: '1px solid var(--erd-rule)', padding: '14px 16px', marginBottom: 10 };

const fieldStyle = {
  width: '100%',
  marginTop: 8,
  padding: '10px',
  fontFamily: 'var(--font-sans)',
  fontWeight: 700,
  fontSize: 12,
  textTransform: 'uppercase',
  border: '1px solid var(--erd-rule)',
};

const btn = {
  border: '1px solid var(--erd-ink)',
  background: 'var(--erd-ink)',
  color: '#fff',
  padding: '8px 12px',
  cursor: 'pointer',
  fontSize: 10,
  fontWeight: 700,
};

const btnOutline = {
  ...btn,
  background: '#fff',
  color: 'var(--erd-ink)',
};

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const id = decodeURIComponent(orderId ?? '');
  const order = useAdminStore(s => s.getOrder(id));
  const updateOrder = useAdminStore(s => s.updateOrder);
  const updateOrderStatus = useAdminStore(s => s.updateOrderStatus);

  const [address, setAddress] = useState('');
  const [total, setTotal] = useState('');
  const [status, setStatus] = useState('pending');
  const [shippingId, setShippingId] = useState('courier');

  useEffect(() => {
    if (!order) return;
    setAddress(order.delivery?.address ?? '');
    setTotal(String(order.totalAmount ?? 0));
    setStatus(order.status);
    setShippingId(order.shipping?.id ?? 'courier');
  }, [order?.id, order]);

  if (!order) {
    return (
      <div>
        <Caps size={11} weight={700}>ЗАКАЗ НЕ НАЙДЕН</Caps>
        <Link to="/admin/orders"><Caps size={10} weight={700}>← НАЗАД</Caps></Link>
      </div>
    );
  }

  const meta = getStatusMeta(order.status);
  const shippingType = SHIPPING_TYPES.find(s => s.id === shippingId) ?? SHIPPING_TYPES[0];

  const save = () => {
    if (status !== order.status) {
      updateOrderStatus(order.id, status);
    }
    updateOrder(order.id, {
      status,
      totalAmount: Number(total) || 0,
      delivery: { address: address.trim() },
      shipping: {
        id: shippingId,
        name: shippingType.name,
        cost: order.shipping?.cost ?? 0,
      },
    });
    alert('Заказ сохранён');
  };

  return (
    <div>
      <Link to="/admin/orders" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Caps size={10} weight={700} color="var(--erd-muted)">← ЗАКАЗЫ</Caps>
      </Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
        <Caps size={14} weight={800}>{order.id}</Caps>
        <Caps size={10} weight={700} style={{ color: meta.color }}>{meta.label}</Caps>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button type="button" style={btnOutline} onClick={() => openInvoice(order)}>
          <Caps size={9} weight={700}>СФОРМИРОВАТЬ СЧЁТ</Caps>
        </button>
        <button type="button" style={btn} onClick={() => openInvoice(order, { print: true })}>
          <Caps size={9} weight={700}>ПЕЧАТЬ СЧЁТА</Caps>
        </button>
      </div>

      <div style={{ ...card, marginTop: 14 }}>
        <Caps size={9} weight={700} color="var(--erd-muted)">РЕДАКТИРОВАНИЕ</Caps>

        <Caps size={8} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 12 }}>СТАТУС</Caps>
        <select value={status} onChange={e => setStatus(e.target.value)} style={fieldStyle}>
          {ORDER_STATUSES.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>

        <Caps size={8} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 12 }}>ТИП ЗАКАЗА</Caps>
        <select value={shippingId} onChange={e => setShippingId(e.target.value)} style={fieldStyle}>
          {SHIPPING_TYPES.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <Caps size={8} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 12 }}>АДРЕС</Caps>
        <textarea
          value={address}
          onChange={e => setAddress(e.target.value)}
          rows={3}
          style={{ ...fieldStyle, textTransform: 'none', resize: 'vertical' }}
        />

        <Caps size={8} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 12 }}>СУММА (₽)</Caps>
        <input
          type="number"
          value={total}
          onChange={e => setTotal(e.target.value)}
          style={{ ...fieldStyle, textTransform: 'none' }}
        />

        <button type="button" onClick={save} style={{ ...btn, marginTop: 16, width: '100%' }}>
          <Caps size={10} weight={800}>СОХРАНИТЬ</Caps>
        </button>
        <Caps size={8} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 8 }}>
          При смене статуса клиент получит уведомление в Telegram
        </Caps>
      </div>

      <div style={card}>
        <Caps size={9} weight={700} color="var(--erd-muted)">КЛИЕНТ</Caps>
        <div style={{ marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, lineHeight: 1.6, textTransform: 'uppercase' }}>
          {order.delivery?.fullName}<br />
          {order.delivery?.phone}<br />
          {order.customer?.telegramUsername && `@${order.customer.telegramUsername}`}
          {order.customer?.telegramId && ` · ID ${order.customer.telegramId}`}
        </div>
      </div>

      <div style={card}>
        <Caps size={9} weight={700} color="var(--erd-muted)">ТОВАРЫ</Caps>
        {(order.items ?? []).map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <Caps size={10} weight={700}>{item.name} · {item.size} ×{item.qty}</Caps>
            <Caps size={10} weight={700}>{((item.price ?? 0) * (item.qty ?? 1)).toLocaleString()} ₽</Caps>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--erd-rule)', marginTop: 12, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
          <Caps size={12} weight={800}>ИТОГО</Caps>
          <Caps size={14} weight={800}>{(order.totalAmount ?? 0).toLocaleString()} ₽</Caps>
        </div>
      </div>

      {(order.notifications?.length > 0) && (
        <div style={card}>
          <Caps size={9} weight={700} color="var(--erd-muted)">УВЕДОМЛЕНИЯ</Caps>
          {order.notifications.map((n, i) => (
            <Caps key={i} size={9} weight={700} style={{ display: 'block', marginTop: 6, lineHeight: 1.4 }}>
              {new Date(n.at).toLocaleString('ru-RU')} — {n.message}
            </Caps>
          ))}
        </div>
      )}
    </div>
  );
}
