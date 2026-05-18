import { useNavigate } from 'react-router-dom';
import PhotoPlaceholder from '../components/PhotoPlaceholder.jsx';
import Caps from '../components/Caps.jsx';
import Rule from '../components/Rule.jsx';
import CTA from '../components/CTA.jsx';
import useStore from '../store/useStore.js';
import tg from '../tg.js';

export default function Cart() {
  const navigate = useNavigate();
  const cart = useStore(s => s.cart);
  const updateQty = useStore(s => s.updateQty);
  const removeFromCart = useStore(s => s.removeFromCart);
  const total = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div style={{
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--erd-paper)',
      paddingTop: 'var(--safe-top)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 900,
          fontSize: 26,
          letterSpacing: '-0.01em',
        }}>
          КОРЗИНА ({count})
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, fontWeight: 300 }}
        >
          ✕
        </button>
      </div>

      <Rule />

      {/* Items */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 120 }}>
        {cart.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 28px',
            gap: 16,
          }}>
            <Caps size={11} weight={700} color="var(--erd-muted)">КОРЗИНА ПУСТА</Caps>
            <button
              onClick={() => navigate('/home')}
              style={{
                border: '1px solid var(--erd-ink)',
                background: 'transparent',
                padding: '12px 24px',
                cursor: 'pointer',
              }}
            >
              <Caps size={10} weight={800}>ПРОДОЛЖИТЬ ПОКУПКИ</Caps>
            </button>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.key} style={{
              padding: '24px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderBottom: '1px solid var(--erd-rule)',
            }}>
              <div style={{ width: 180 }}>
                <PhotoPlaceholder id={item.product.photoId} kind={item.product.photoKind} />
              </div>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: '0.02em',
                marginTop: 16,
                textAlign: 'center',
              }}>
                {item.product.name}
              </div>
              <div style={{ marginTop: 6, textAlign: 'center' }}>
                <Caps size={10} weight={700} color="var(--erd-muted)" style={{ display: 'block', lineHeight: 1.6 }}>
                  РАЗМЕР {item.size}
                </Caps>
                <Caps size={10} weight={700} style={{ marginTop: 4, display: 'block' }}>
                  {(item.product.price * item.qty).toLocaleString()} ₽
                </Caps>
              </div>

              {/* Quantity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 14 }}>
                <button
                  onClick={() => { tg.haptic.selection(); updateQty(item.key, -1); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, fontWeight: 300, padding: '4px 8px' }}
                >
                  −
                </button>
                <Caps size={11} weight={700}>{item.qty}</Caps>
                <button
                  onClick={() => { tg.haptic.selection(); updateQty(item.key, 1); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, fontWeight: 300, padding: '4px 8px' }}
                >
                  +
                </button>
              </div>

              {/* Remove */}
              <button
                onClick={() => { tg.haptic.impact(); removeFromCart(item.key); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: 8 }}
              >
                <Caps size={9} weight={700} color="var(--erd-muted)">УДАЛИТЬ</Caps>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Sticky bottom */}
      {cart.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          padding: '16px 18px',
          paddingBottom: 'calc(16px + var(--safe-bottom))',
          background: 'var(--erd-paper)',
          borderTop: '1px solid var(--erd-rule)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            alignItems: 'baseline',
            marginBottom: 14,
          }}>
            <Caps size={11} weight={700} color="var(--erd-muted)">ИТОГО:</Caps>
            <Caps size={13} weight={800}>{total.toLocaleString()} ₽</Caps>
          </div>
          <CTA onClick={() => navigate('/checkout')}>ПЕРЕЙТИ К ОФОРМЛЕНИЮ</CTA>
        </div>
      )}
    </div>
  );
}
