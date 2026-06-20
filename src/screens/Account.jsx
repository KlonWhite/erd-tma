import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header.jsx';
import Rule from '../components/Rule.jsx';
import Caps from '../components/Caps.jsx';
import BottomNav from '../components/BottomNav.jsx';
import useStore from '../store/useStore.js';
import { fetchMyOrders } from '../lib/accountApi.js';
import tg from '../tg.js';

const STATUS_META = {
  pending: { label: 'НОВЫЙ', color: 'var(--erd-ox)' },
  processing: { label: 'В ОБРАБОТКЕ', color: 'var(--erd-ox)' },
  shipped: { label: 'ОТПРАВЛЕН', color: '#1a5a8a' },
  delivered: { label: 'ДОСТАВЛЕН', color: 'var(--erd-muted)' },
  cancelled: { label: 'ОТМЕНЁН', color: 'var(--erd-muted)' },
};

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();
}

function normalizeOrder(order) {
  const status = STATUS_META[order.status] ?? {
    label: order.status ?? 'НОВЫЙ',
    color: 'var(--erd-muted)',
  };

  return {
    id: order.id,
    date: formatDate(order.createdAt ?? order.date),
    total: order.totalAmount != null
      ? `${Number(order.totalAmount).toLocaleString('ru-RU')} ₽`
      : order.total,
    statusLabel: status.label,
    statusColor: status.color,
    items: order.items ?? [],
    shipping: order.shipping ?? {},
    notifications: order.notifications ?? [],
  };
}

export default function Account() {
  const [tgUser, setTgUser] = useState(tg.user);
  const localOrders = useStore(s => s.orders);
  const wishlist = useStore(s => s.wishlist);
  const [serverOrders, setServerOrders] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(tg.isMiniApp);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    if (tgUser?.id || !tg.isMiniApp) return undefined;

    const started = Date.now();
    const timer = window.setInterval(() => {
      const user = tg.user;
      if (user?.id || Date.now() - started > 3000) {
        setTgUser(user);
        window.clearInterval(timer);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [tgUser?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      if (!tg.isMiniApp) return;
      setLoadingOrders(true);
      setOrdersError('');
      try {
        const orders = await fetchMyOrders();
        if (!cancelled) setServerOrders(orders);
      } catch (err) {
        if (!cancelled) {
          console.warn('[account] orders:', err);
          setOrdersError(err.message ?? 'Не удалось загрузить заказы');
        }
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    }

    loadOrders();
    return () => { cancelled = true; };
  }, []);

  const orders = useMemo(
    () => (serverOrders ?? (tg.isMiniApp ? [] : localOrders)).map(normalizeOrder),
    [serverOrders, localOrders],
  );

  const STATS = [
    ['ЗАКАЗЫ', String(orders.length)],
    ['ИЗБРАННОЕ', String(wishlist.length)],
    ['АДРЕСА', '1'],
    ['ОПЛАТА', 'TG'],
  ];
  const name = (tgUser?.first_name || tgUser?.username || 'MEMBER').toUpperCase();

  return (
    <>
      <div className="screen">
        <Header />

        <div style={{ padding: '20px 18px 18px' }}>
          <Caps size={9} weight={700} color="var(--erd-ox)">УЧАСТНИК · ЗАКРЫТЫЙ КЛУБ</Caps>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 900,
            fontSize: 34,
            lineHeight: 0.95,
            letterSpacing: '-0.01em',
            marginTop: 8,
            transform: 'scaleX(0.92)',
            transformOrigin: 'left',
          }}>
            ПРИВЕТ,<br />
            <span style={{ fontStyle: 'italic' }}>{name}.</span>
          </div>
        </div>

        <Rule />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {STATS.map(([k, v], i) => (
            <div key={k} style={{
              padding: '16px',
              borderRight: i % 2 === 0 ? '1px solid var(--erd-rule)' : 'none',
              borderBottom: '1px solid var(--erd-rule)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}>
              <Caps size={10} weight={800}>{k}</Caps>
              <Caps size={18} weight={800}>{v}</Caps>
            </div>
          ))}
        </div>

        <div style={{
          padding: '16px 18px 8px',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <Caps size={10} weight={800}>ПОСЛЕДНИЕ ЗАКАЗЫ</Caps>
          <Caps size={10} weight={700} color="var(--erd-muted)">
            {loadingOrders ? 'ЗАГРУЗКА…' : 'ВСЕ →'}
          </Caps>
        </div>

        {ordersError && (
          <div style={{ padding: '0 18px 12px' }}>
            <Caps size={9} weight={700} color="var(--erd-ox)">{ordersError}</Caps>
          </div>
        )}

        {orders.length === 0 && !loadingOrders && (
          <div style={{ padding: '28px 18px', borderTop: '1px solid var(--erd-rule)' }}>
            <Caps size={11} weight={800}>ЗАКАЗОВ ПОКА НЕТ</Caps>
            <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 8, lineHeight: 1.5 }}>
              Оформите первый заказ — история появится здесь автоматически.
            </Caps>
          </div>
        )}

        {orders.map(o => (
          <div key={o.id} style={{
            padding: '14px 18px',
            borderTop: '1px solid var(--erd-rule)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Caps size={11} weight={800}>{o.id}</Caps>
              <Caps size={9} weight={700} color={o.statusColor}>
                {o.statusLabel}
              </Caps>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginTop: 6,
            }}>
              <Caps size={9} weight={700} color="var(--erd-muted)">{o.date}</Caps>
              <Caps size={12} weight={800}>{o.total}</Caps>
            </div>
            {o.items.length > 0 && (
              <Caps size={8} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 8, lineHeight: 1.5 }}>
                {o.items.slice(0, 2).map(item => `${item.name} · ${item.size} ×${item.qty}`).join(' / ')}
                {o.items.length > 2 ? ` / +${o.items.length - 2}` : ''}
              </Caps>
            )}
            {(o.shipping?.trackingNumber || o.shipping?.providerName) && (
              <Caps size={8} weight={700} color="var(--erd-ox)" style={{ display: 'block', marginTop: 6, lineHeight: 1.5 }}>
                ДОСТАВКА: {o.shipping.providerName || o.shipping.provider || '—'}
                {o.shipping.trackingNumber ? ` · ${o.shipping.trackingNumber}` : ''}
              </Caps>
            )}
            {o.shipping?.trackingUrl && (
              <a
                href={o.shipping.trackingUrl}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', marginTop: 6, color: 'inherit', textDecoration: 'underline' }}
              >
                <Caps size={8} weight={800}>ОТСЛЕДИТЬ ЗАКАЗ ↗</Caps>
              </a>
            )}
            {o.notifications.length > 0 && (
              <Caps size={8} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 6, lineHeight: 1.5 }}>
                ПОСЛЕДНЕЕ: {o.notifications[o.notifications.length - 1]?.message}
              </Caps>
            )}
          </div>
        ))}

        <Rule mt={16} />

        <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['НАСТРОЙКИ', 'АДРЕСА', 'УВЕДОМЛЕНИЯ', 'ВЫЙТИ'].map(item => (
            <button
              key={item}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 0', textAlign: 'left',
                borderBottom: '1px solid var(--erd-rule)',
              }}
            >
              <Caps size={11} weight={700}>{item}</Caps>
            </button>
          ))}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
