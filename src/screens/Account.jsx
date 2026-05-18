import Header from '../components/Header.jsx';
import Rule from '../components/Rule.jsx';
import Caps from '../components/Caps.jsx';
import BottomNav from '../components/BottomNav.jsx';
import useStore from '../store/useStore.js';
import tg from '../tg.js';

export default function Account() {
  const name = tg.userName || 'MEMBER';
  const orders = useStore(s => s.orders);
  const wishlist = useStore(s => s.wishlist);

  const STATS = [
    ['ЗАКАЗЫ', String(orders.length)],
    ['ИЗБРАННОЕ', String(wishlist.length)],
    ['АДРЕСА', '1'],
    ['ОПЛАТА', 'TG'],
  ];

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
          <Caps size={10} weight={700} color="var(--erd-muted)">ВСЕ →</Caps>
        </div>

        {orders.map(o => (
          <div key={o.id} style={{
            padding: '14px 18px',
            borderTop: '1px solid var(--erd-rule)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Caps size={11} weight={800}>{o.id}</Caps>
              <Caps size={9} weight={700} color={o.status === 'В ПУТИ' || o.status === 'В ОБРАБОТКЕ' ? 'var(--erd-ox)' : 'var(--erd-muted)'}>
                {o.status}
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
