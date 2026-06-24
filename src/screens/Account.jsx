import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header.jsx';
import Rule from '../components/Rule.jsx';
import Caps from '../components/Caps.jsx';
import BottomNav from '../components/BottomNav.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Skeleton from '../components/Skeleton.jsx';
import useStore from '../store/useStore.js';
import { fetchMyOrders, fetchProfile } from '../lib/accountApi.js';
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

function OrderSkeleton() {
  return (
    <div style={{ padding: '14px 18px', borderTop: '1px solid var(--erd-rule)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton width={92} height={12} />
        <Skeleton width={76} height={10} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <Skeleton width={72} height={9} />
        <Skeleton width={64} height={12} />
      </div>
      <Skeleton width="84%" height={8} style={{ marginTop: 12 }} />
    </div>
  );
}

export default function Account() {
  const [tgUser, setTgUser] = useState(tg.user);
  const localOrders = useStore(s => s.orders);
  const wishlist = useStore(s => s.wishlist);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(tg.hasTelegramUserContext);
  const [profileError, setProfileError] = useState('');
  const [serverOrders, setServerOrders] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(tg.hasTelegramUserContext);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    if (tgUser?.id || !tg.hasTelegramUserContext) return undefined;

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

    async function loadProfile() {
      if (!tg.hasTelegramUserContext) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      setProfileError('');
      try {
        const result = await fetchProfile();
        if (!cancelled) {
          setProfile(result);
          if (result?.user?.id) {
            setTgUser({
              id: result.user.id,
              first_name: result.user.firstName,
              username: result.user.username,
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[account] profile:', err);
          setProfileError(err.message ?? 'Не удалось загрузить профиль');
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }

    loadProfile();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      if (!tg.hasTelegramUserContext) return;
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
    () => (serverOrders ?? (tg.hasTelegramUserContext ? [] : localOrders)).map(normalizeOrder),
    [serverOrders, localOrders],
  );

  const profileUser = profile?.user ?? {};
  const roles = profileUser.roles ?? [];
  const memberStatus = roles.includes('admin') ? 'ADMIN' : 'CLIENT';
  const launchSource = profile?.source === 'botKeyboard' ? 'BOT' : 'TG';
  const STATS = [
    ['ЗАКАЗЫ', String(profile?.stats?.orders ?? orders.length)],
    ['ИЗБРАННОЕ', String(profile?.stats?.wishlist ?? wishlist.length)],
    ['СТАТУС', memberStatus],
    ['ВХОД', tg.hasTelegramUserContext ? launchSource : 'WEB'],
  ];
  const name = (profileUser.firstName || tgUser?.first_name || tgUser?.username || 'MEMBER').toUpperCase();
  const username = profileUser.username || tgUser?.username || '';
  const telegramId = profileUser.id || tgUser?.id || null;
  const memberSince = profileUser.memberSince
    ? formatDate(profileUser.memberSince)
    : '';

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
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <Caps size={9} weight={800} color="var(--erd-muted)">
              {loadingProfile ? 'ПРОФИЛЬ ЗАГРУЖАЕТСЯ…' : `${memberStatus} · ${tg.hasTelegramUserContext ? 'TELEGRAM VERIFIED' : 'LOCAL PREVIEW'}`}
            </Caps>
            {(username || telegramId) && (
              <Caps size={9} weight={700} color="var(--erd-muted)">
                {username ? `@${username}` : 'TELEGRAM'}{telegramId ? ` · ID ${telegramId}` : ''}
              </Caps>
            )}
            {memberSince && (
              <Caps size={8} weight={700} color="var(--erd-muted)">В КЛУБЕ С {memberSince}</Caps>
            )}
          </div>
        </div>

        <Rule />

        {profileError && (
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--erd-rule)' }}>
            <Caps size={9} weight={700} color="var(--erd-ox)">
              {profileError}. Откройте магазин через /start в боте, чтобы обновить доступ.
            </Caps>
          </div>
        )}

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

        {loadingOrders && (
          <>
            <OrderSkeleton />
            <OrderSkeleton />
          </>
        )}

        {orders.length === 0 && !loadingOrders && (
          <EmptyState
            compact
            eyebrow="ORDERS · HISTORY"
            title="Заказов пока нет"
            body="После оформления покупки здесь появятся статусы, состав заказа и трек-номер доставки."
            symbol="#"
          />
        )}

        {!loadingOrders && orders.map(o => (
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
