import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductThumb from '../components/ProductThumb.jsx';
import Caps from '../components/Caps.jsx';
import Rule from '../components/Rule.jsx';
import CTA from '../components/CTA.jsx';
import useStore from '../store/useStore.js';
import { getProduct } from '../lib/catalog.js';
import { computeCartTotals } from '../utils/cartTotals.js';
import tg from '../tg.js';

const FOOTER_H = 300;

const fmt = (n) => (Number(n) || 0).toLocaleString('ru-RU');

const inputStyle = {
  flex: 1,
  fontFamily: 'var(--font-sans)',
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  border: '1px solid var(--erd-rule)',
  padding: '10px 12px',
  background: 'var(--erd-paper)',
  color: 'var(--erd-ink)',
  outline: 'none',
  minWidth: 0,
};

export default function Cart() {
  const navigate = useNavigate();
  const cart = useStore(s => s.cart);
  const updateQty = useStore(s => s.updateQty);
  const removeFromCart = useStore(s => s.removeFromCart);
  const promo = useStore(s => s.promo);
  const promoError = useStore(s => s.promoError);
  const applyPromo = useStore(s => s.applyPromo);
  const clearPromo = useStore(s => s.clearPromo);
  const syncCartProducts = useStore(s => s.syncCartProducts);

  const { subtotal, discount, total } = useMemo(
    () => computeCartTotals(cart, promo),
    [cart, promo],
  );

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const [code, setCode] = useState('');

  useEffect(() => {
    syncCartProducts();
  }, [syncCartProducts]);

  const handleApplyPromo = async () => {
    tg.haptic.selection();
    const ok = await applyPromo(code);
    if (ok) {
      tg.haptic.notification('success');
      setCode('');
    } else {
      tg.haptic.notification('error');
    }
  };

  return (
    <div style={{
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--erd-paper)',
      paddingTop: 'var(--safe-top)',
    }}>
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
          type="button"
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, fontWeight: 300 }}
        >
          ✕
        </button>
      </div>

      <Rule />

      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: cart.length > 0 ? FOOTER_H : 16,
      }}>
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
              type="button"
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
          cart.map(item => {
            const product = getProduct(item.productId ?? item.product?.id) ?? item.product;
            return (
              <div key={item.key} style={{
                padding: '16px 18px',
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
                borderBottom: '1px solid var(--erd-rule)',
              }}>
                <div style={{ width: 88, flexShrink: 0 }}>
                  <ProductThumb product={product} productId={item.productId ?? item.product?.id} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 900,
                    fontSize: 13,
                    letterSpacing: '0.02em',
                    lineHeight: 1.25,
                  }}>
                    {product?.name}
                  </div>
                  <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 6 }}>
                    РАЗМЕР {item.size}
                  </Caps>
                  <Caps size={11} weight={800} style={{ display: 'block', marginTop: 8 }}>
                    {fmt((Number(product?.price) || 0) * item.qty)} ₽
                  </Caps>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
                    <button type="button" onClick={() => { tg.haptic.selection(); updateQty(item.key, -1); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 0 }}>−</button>
                    <Caps size={11} weight={700}>{item.qty}</Caps>
                    <button type="button" onClick={() => { tg.haptic.selection(); updateQty(item.key, 1); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 0 }}>+</button>
                    <button type="button" onClick={() => { tg.haptic.impact(); removeFromCart(item.key); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
                      <Caps size={9} weight={700} color="var(--erd-muted)">УДАЛИТЬ</Caps>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {cart.length > 0 && (
        <div style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          padding: '14px 18px',
          paddingBottom: 'calc(14px + var(--safe-bottom))',
          background: 'var(--erd-paper)',
          borderTop: '1px solid var(--erd-ink)',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.08)',
        }}>
          <Caps size={9} weight={800} color="var(--erd-ox)">ПРОМОКОД</Caps>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === 'Enter') handleApplyPromo(); }}
              placeholder="KOVBOI10"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              style={{
                border: '1px solid var(--erd-ink)',
                background: 'var(--erd-ink)',
                color: 'var(--erd-paper)',
                padding: '10px 14px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Caps size={9} weight={800}>OK</Caps>
            </button>
          </div>

          {promo && (
            <div style={{
              marginTop: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px',
              border: '1px solid var(--erd-ink)',
            }}>
              <Caps size={8} weight={800}>{promo.code} · {promo.label}</Caps>
              <button type="button" onClick={() => { tg.haptic.selection(); clearPromo(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <Caps size={9} weight={700} color="var(--erd-muted)">✕</Caps>
              </button>
            </div>
          )}

          {promoError && (
            <Caps size={8} weight={700} color="var(--erd-ox)" style={{ display: 'block', marginTop: 6 }}>
              {promoError}
            </Caps>
          )}

          {discount > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <Caps size={9} weight={700} color="var(--erd-muted)">ПОДЫТОГ</Caps>
                <Caps size={9} weight={700}>{fmt(subtotal)} ₽</Caps>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <Caps size={9} weight={700} color="var(--erd-ox)">СКИДКА</Caps>
                <Caps size={9} weight={700} color="var(--erd-ox)">−{fmt(discount)} ₽</Caps>
              </div>
            </>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginTop: 10,
            marginBottom: 12,
          }}>
            <Caps size={11} weight={700} color="var(--erd-muted)">ИТОГО:</Caps>
            <Caps size={14} weight={800}>{fmt(total)} ₽</Caps>
          </div>
          <CTA onClick={() => navigate('/checkout')}>ПЕРЕЙТИ К ОФОРМЛЕНИЮ</CTA>
        </div>
      )}
    </div>
  );
}
