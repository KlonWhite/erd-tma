import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Caps from '../components/Caps.jsx';
import Rule from '../components/Rule.jsx';
import CTA from '../components/CTA.jsx';
import useStore from '../store/useStore.js';
import tg from '../tg.js';

const STEPS = ['АДРЕС', 'ДОСТАВКА', 'ОПЛАТА'];

const SHIPPING_OPTIONS = [
  { id: 'standard', name: 'СТАНДАРТ', days: '3–5 РАБОЧИХ ДНЕЙ', price: 0, label: 'БЕСПЛАТНО' },
  { id: 'express', name: 'ЭКСПРЕСС', days: '1–2 ДНЯ', price: 500, label: '500 ₽' },
  { id: 'white-glove', name: 'КУРЬЕР', days: 'ДОСТАВКА ПО МОСКВЕ', price: 1000, label: '1 000 ₽' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const cart = useStore(s => s.cart);
  const clearCart = useStore(s => s.clearCart);
  const addOrder = useStore(s => s.addOrder);
  const total = cart.reduce((s, i) => s + i.product.price * i.qty, 0);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cart.length, navigate]);

  const [step, setStep] = useState(0);
  const [shipping, setShipping] = useState('standard');
  const [sending, setSending] = useState(false);

  const selectedShipping = SHIPPING_OPTIONS.find(o => o.id === shipping);
  const orderTotal = total + (selectedShipping?.price ?? 0);

  const handleConfirm = () => {
    if (sending) return;
    setSending(true);
    tg.haptic.notification('success');

    const order = {
      type: 'erd_order',
      items: cart.map(i => ({
        productId: i.product.id,
        name: i.product.name,
        size: i.size,
        qty: i.qty,
        price: i.product.price,
      })),
      shipping: selectedShipping?.id,
      subtotal: total,
      shippingCost: selectedShipping?.price ?? 0,
      total: orderTotal,
      currency: 'USD',
    };

    const orderId = `#ERD-${String(Date.now()).slice(-5)}`;
    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();

    tg.sendOrder(order);
    addOrder({
      id: orderId,
      date: dateStr,
      total: `${orderTotal.toLocaleString()} ₽`,
      status: 'В ОБРАБОТКЕ',
    });
    clearCart();
    navigate('/account', { replace: true });
  };

  const nextStep = () => {
    tg.haptic.selection();
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      handleConfirm();
    }
  };

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
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/cart')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <Caps size={10} weight={700}>← {step > 0 ? STEPS[step - 1] : 'КОРЗИНА'}</Caps>
        </button>
        <Caps size={10} weight={700} color="var(--erd-muted)">БЕЗОПАСНО ⊙</Caps>
      </div>

      {/* Title + steps */}
      <div style={{ padding: '4px 18px 16px', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 900,
          fontSize: 30,
          letterSpacing: '-0.01em',
          transform: 'scaleX(0.92)',
          transformOrigin: 'left',
        }}>
          ОФОРМЛЕНИЕ
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              paddingBottom: 6,
              borderBottom: `2px solid ${i === step ? 'var(--erd-ink)' : 'transparent'}`,
              opacity: i === step ? 1 : 0.4,
            }}>
              <Caps size={9} weight={800}>{s}</Caps>
            </div>
          ))}
        </div>
      </div>

      <Rule />

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 120 }}>
        {/* Step 0: Address */}
        {step === 0 && (
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--erd-rule)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Caps size={9} weight={700} color="var(--erd-muted)">ДОСТАВИТЬ</Caps>
              <Caps size={9} weight={700} color="var(--erd-ox)">ИЗМЕНИТЬ</Caps>
            </div>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1.6,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginTop: 8,
            }}>
              {tg.userName}<br />
              УЛ. ТВЕРСКАЯ, 15<br />
              125009 МОСКВА, РОССИЯ
            </div>
          </div>
        )}

        {/* Step 1: Shipping */}
        {step === 1 && (
          <div style={{ padding: '16px 18px' }}>
            <Caps size={9} weight={700} color="var(--erd-muted)">СПОСОБ ДОСТАВКИ</Caps>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SHIPPING_OPTIONS.map(o => (
                <button
                  key={o.id}
                  onClick={() => { tg.haptic.selection(); setShipping(o.id); }}
                  style={{
                    border: `1px solid ${o.id === shipping ? 'var(--erd-ink)' : 'var(--erd-rule)'}`,
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'transparent',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: 8,
                      border: '1px solid var(--erd-ink)',
                      background: o.id === shipping ? 'var(--erd-ink)' : 'transparent',
                      boxShadow: o.id === shipping ? 'inset 0 0 0 2px var(--erd-paper), inset 0 0 0 3px var(--erd-ink)' : 'none',
                    }} />
                    <div>
                      <Caps size={11} weight={800} style={{ display: 'block' }}>{o.name}</Caps>
                      <Caps size={9} weight={700} color="var(--erd-muted)" style={{ marginTop: 2, display: 'block' }}>
                        {o.days}
                      </Caps>
                    </div>
                  </div>
                  <Caps size={10} weight={700}>{o.label}</Caps>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Payment summary */}
        {step === 2 && (
          <div style={{ padding: '16px 18px' }}>
            <Caps size={9} weight={700} color="var(--erd-muted)">СОСТАВ ЗАКАЗА</Caps>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cart.map(item => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Caps size={10} weight={700} style={{ maxWidth: '65%', lineHeight: 1.4 }}>
                    {item.product.name} × {item.qty}
                  </Caps>
                  <Caps size={10} weight={700}>{(item.product.price * item.qty).toLocaleString()} ₽</Caps>
                </div>
              ))}
              <Rule mt={8} mb={8} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Caps size={10} weight={700} color="var(--erd-muted)">ДОСТАВКА</Caps>
                <Caps size={10} weight={700}>{selectedShipping?.label}</Caps>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <Caps size={12} weight={800}>ИТОГО</Caps>
                <Caps size={14} weight={800}>{orderTotal.toLocaleString()} ₽</Caps>
              </div>
            </div>

            <div style={{
              marginTop: 20, padding: '14px',
              border: '1px solid var(--erd-rule)',
              background: 'rgba(0,0,0,0.03)',
            }}>
              <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', lineHeight: 1.8 }}>
                ОПЛАТА ЧЕРЕЗ TELEGRAM<br />
                ВАШ ЗАКАЗ БУДЕТ ПОДТВЕРЖДЁН<br />
                НАШИМ БОТОМ ПОСЛЕ ОТПРАВКИ
              </Caps>
            </div>
          </div>
        )}

        {/* Totals bar (always visible) */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--erd-rule)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Caps size={10} weight={800}>
              ИТОГО — {cart.reduce((s, i) => s + i.qty, 0)} ШТ.
            </Caps>
            <Caps size={14} weight={800}>{orderTotal.toLocaleString()} ₽</Caps>
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: '12px 18px',
        paddingBottom: 'calc(12px + var(--safe-bottom))',
        background: 'var(--erd-paper)',
        borderTop: '1px solid var(--erd-rule)',
      }}>
        <CTA onClick={nextStep} disabled={sending}>
          {step < STEPS.length - 1
            ? `ДАЛЕЕ: ${STEPS[step + 1]}  →`
            : (sending ? 'ОТПРАВКА...' : 'ПОДТВЕРДИТЬ ЗАКАЗ')}
        </CTA>
      </div>
    </div>
  );
}
