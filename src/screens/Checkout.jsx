import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Caps from '../components/Caps.jsx';
import Rule from '../components/Rule.jsx';
import CTA from '../components/CTA.jsx';
import DeliveryAddressForm from '../components/DeliveryAddressForm.jsx';
import DemoPaymentSheet from '../components/DemoPaymentSheet.jsx';
import useStore from '../store/useStore.js';
import { incrementPromoUsage } from '../utils/promo.js';
import { computeCartTotals } from '../utils/cartTotals.js';
import { getProduct } from '../lib/catalog.js';
import {
  SHIPPING_OPTIONS,
  getShippingOption,
  shippingNeedsAddress,
} from '../utils/checkout.js';
import { createOrderFromCheckout } from '../lib/ordersDb.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import tg from '../tg.js';

const fmt = (n) => (Number(n) || 0).toLocaleString('ru-RU');

function buildSteps(shippingId) {
  if (shippingNeedsAddress(shippingId)) {
    return ['СПОСОБ', 'АДРЕС', 'ОПЛАТА'];
  }
  return ['СПОСОБ', 'ОПЛАТА'];
}

export default function Checkout() {
  const navigate = useNavigate();
  const cart = useStore(s => s.cart);
  const clearCart = useStore(s => s.clearCart);
  const addOrder = useStore(s => s.addOrder);
  const promo = useStore(s => s.promo);
  const delivery = useStore(s => s.delivery);
  const setDelivery = useStore(s => s.setDelivery);

  const { subtotal, discount, total } = useMemo(
    () => computeCartTotals(cart, promo),
    [cart, promo],
  );

  const [shipping, setShipping] = useState('pickup');
  const [step, setStep] = useState(0);
  const [sending, setSending] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [demoPaymentOpen, setDemoPaymentOpen] = useState(false);

  const steps = useMemo(() => buildSteps(shipping), [shipping]);
  const selectedShipping = getShippingOption(shipping);
  const orderTotal = total + (selectedShipping?.price ?? 0);
  const paymentStepIndex = steps.length - 1;
  const addressStepIndex = steps.indexOf('АДРЕС');

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cart.length, navigate]);

  useEffect(() => {
    if (step >= steps.length) {
      setStep(Math.max(0, steps.length - 1));
    }
  }, [steps.length, step]);

  const selectShipping = (id) => {
    tg.haptic.selection();
    setShipping(id);
    if (shippingNeedsAddress(id)) {
      setStep(1);
    }
  };

  const canProceed = () => {
    if (step === addressStepIndex) {
      return delivery.address.trim().length >= 5;
    }
    return true;
  };

  const completeOrder = async () => {
    setOrderError('');
    const orderId = `#ERD-${String(Date.now()).slice(-5)}`;
    const tgUser = tg.user;
    const customer = {
      fullName: delivery.fullName || tgUser?.first_name || 'Гость',
      phone: delivery.phone || '',
      telegramId: tgUser?.id ?? null,
      telegramUsername: tgUser?.username ?? '',
    };
    const deliveryInfo = {
      fullName: delivery.fullName || '',
      address: delivery.address || selectedShipping.pickupAddress || '',
      phone: delivery.phone || '',
    };
    const shippingDetail = {
      id: selectedShipping.id,
      name: selectedShipping.name,
      cost: selectedShipping.price,
    };
    const paymentDetail = {
      id: 'demo',
      name: 'ДЕМО-ОПЛАТА',
      status: 'paid',
    };

    const order = {
      type: 'erd_order',
      orderId,
      items: cart.map(i => ({
        productId: i.productId ?? i.product?.id,
        name: i.product?.name,
        size: i.size,
        qty: i.qty,
        price: i.product?.price,
      })),
      shipping: selectedShipping.id,
      address: delivery.address || deliveryInfo.address,
      coords: delivery.lat != null ? { lat: delivery.lat, lng: delivery.lng } : null,
      subtotal,
      promoCode: promo?.code ?? null,
      discount,
      shippingCost: selectedShipping.price,
      total: orderTotal,
      currency: 'RUB',
      payment: 'demo',
      customer,
      delivery: deliveryInfo,
      shippingDetail,
      paymentDetail,
    };

    const dateStr = new Date().toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();

    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase не настроен');
      }

      await createOrderFromCheckout(order, tgUser);

      if (promo?.code) {
        await incrementPromoUsage(promo.code);
      }

      addOrder({
        id: orderId,
        date: dateStr,
        total: `${fmt(orderTotal)} ₽`,
        status: 'ОПЛАЧЕН',
      });
      clearCart();
      setDemoPaymentOpen(false);
      setSending(false);

      // sendData закрывает Mini App и отправляет заказ боту
      if (tg.isAvailable) {
        tg.sendOrder(order);
        return;
      }

      navigate('/account', { replace: true });
    } catch (err) {
      console.error('[checkout]', err);
      setOrderError(err.message ?? 'Не удалось оформить заказ');
      setSending(false);
      setDemoPaymentOpen(false);
      tg.haptic.notification('error');
    }
  };

  const handleConfirm = () => {
    if (sending) return;
    setSending(true);
    tg.haptic.selection();
    setDemoPaymentOpen(true);
  };

  const nextStep = () => {
    if (!canProceed()) {
      tg.haptic.notification('error');
      return;
    }
    tg.haptic.selection();
    if (step < paymentStepIndex) {
      setStep(s => s + 1);
    } else {
      handleConfirm();
    }
  };

  const goBack = () => {
    if (step > 0) setStep(s => s - 1);
    else navigate('/cart');
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
        <button
          type="button"
          onClick={goBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <Caps size={10} weight={700}>
            ← {step > 0 ? steps[step - 1] : 'КОРЗИНА'}
          </Caps>
        </button>
        <Caps size={10} weight={700} color="var(--erd-muted)">БЕЗОПАСНО ⊙</Caps>
      </div>

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
          {steps.map((s, i) => (
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

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 120 }}>
        {/* Шаг: способ доставки */}
        {steps[step] === 'СПОСОБ' && (
          <div style={{ padding: '16px 18px' }}>
            <Caps size={9} weight={700} color="var(--erd-muted)">СПОСОБ ДОСТАВКИ</Caps>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SHIPPING_OPTIONS.map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => selectShipping(o.id)}
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
                      width: 12,
                      height: 12,
                      borderRadius: 8,
                      border: '1px solid var(--erd-ink)',
                      background: o.id === shipping ? 'var(--erd-ink)' : 'transparent',
                      boxShadow: o.id === shipping
                        ? 'inset 0 0 0 2px var(--erd-paper), inset 0 0 0 3px var(--erd-ink)'
                        : 'none',
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

            {shipping === 'pickup' && selectedShipping.pickupAddress && (
              <div style={{
                marginTop: 16,
                padding: '12px 14px',
                border: '1px solid var(--erd-rule)',
              }}>
                <Caps size={9} weight={700} color="var(--erd-muted)">ПУНКТ САМОВЫВОЗА</Caps>
                <Caps size={10} weight={700} style={{ display: 'block', marginTop: 8, lineHeight: 1.5 }}>
                  {selectedShipping.pickupAddress}
                </Caps>
              </div>
            )}
          </div>
        )}

        {/* Шаг: адрес (доставка / почта) */}
        {steps[step] === 'АДРЕС' && (
          <>
            <div style={{ padding: '12px 18px 0' }}>
              <Caps size={9} weight={700} color="var(--erd-muted)">
                {selectedShipping.name} · {selectedShipping.label}
              </Caps>
            </div>
            <DeliveryAddressForm
              address={delivery.address}
              lat={delivery.lat}
              lng={delivery.lng}
              onAddressChange={(address) => setDelivery({ address })}
              onCoordsChange={(lat, lng) => setDelivery({ lat, lng })}
              showMap={selectedShipping.showMap !== false}
              eta={selectedShipping.eta ?? '45–60 МИН'}
            />
          </>
        )}

        {/* Шаг: оплата */}
        {steps[step] === 'ОПЛАТА' && (
          <div style={{ padding: '16px 18px' }}>
            <Caps size={9} weight={700} color="var(--erd-muted)">СОСТАВ ЗАКАЗА</Caps>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cart.map(item => {
                const product = getProduct(item.productId ?? item.product?.id) ?? item.product;
                return (
                  <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Caps size={10} weight={700} style={{ maxWidth: '65%', lineHeight: 1.4 }}>
                      {product?.name} × {item.qty}
                    </Caps>
                    <Caps size={10} weight={700}>
                      {fmt((Number(product?.price) || 0) * item.qty)} ₽
                    </Caps>
                  </div>
                );
              })}
              <Rule mt={8} mb={8} />
              {discount > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Caps size={10} weight={700} color="var(--erd-muted)">ПОДЫТОГ</Caps>
                    <Caps size={10} weight={700}>{fmt(subtotal)} ₽</Caps>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Caps size={10} weight={700} color="var(--erd-ox)">
                      СКИДКА {promo ? `(${promo.code})` : ''}
                    </Caps>
                    <Caps size={10} weight={700} color="var(--erd-ox)">−{fmt(discount)} ₽</Caps>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Caps size={10} weight={700} color="var(--erd-muted)">ДОСТАВКА</Caps>
                <Caps size={10} weight={700}>{selectedShipping.label}</Caps>
              </div>
              {delivery.address && selectedShipping.needsAddress && (
                <Caps size={9} weight={700} color="var(--erd-muted)" style={{ lineHeight: 1.5 }}>
                  {delivery.address}
                </Caps>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <Caps size={12} weight={800}>ИТОГО</Caps>
                <Caps size={14} weight={800}>{fmt(orderTotal)} ₽</Caps>
              </div>
            </div>

            <div style={{
              marginTop: 20,
              padding: '14px',
              border: '1px solid var(--erd-rule)',
              background: 'rgba(0,0,0,0.03)',
            }}>
              <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', lineHeight: 1.8 }}>
                ДЕМО-ОПЛАТА · БЕЗОПАСНАЯ ПРОВЕРКА<br />
                ПОСЛЕ ПОДТВЕРЖДЕНИЯ ОТКРОЕТСЯ ЭКРАН ОПЛАТЫ
              </Caps>
            </div>
          </div>
        )}

        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--erd-rule)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Caps size={10} weight={800}>
              ИТОГО — {cart.reduce((s, i) => s + i.qty, 0)} ШТ.
            </Caps>
            <Caps size={14} weight={800}>{fmt(orderTotal)} ₽</Caps>
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 18px',
        paddingBottom: 'calc(12px + var(--safe-bottom))',
        background: 'var(--erd-paper)',
        borderTop: '1px solid var(--erd-rule)',
      }}>
        <CTA onClick={nextStep} disabled={sending || !canProceed()}>
          {step < paymentStepIndex
            ? `ДАЛЕЕ: ${steps[step + 1]}  →`
            : (sending ? 'ОПЛАТА...' : 'ОПЛАТИТЬ ЗАКАЗ')}
        </CTA>
        {orderError && (
          <Caps size={9} weight={700} color="var(--erd-ox)" style={{ display: 'block', marginTop: 10, lineHeight: 1.5 }}>
            {orderError}
          </Caps>
        )}
      </div>

      <DemoPaymentSheet
        open={demoPaymentOpen}
        amount={orderTotal}
        currency="RUB"
        onSuccess={completeOrder}
        onClose={() => {
          setDemoPaymentOpen(false);
          setSending(false);
        }}
      />
    </div>
  );
}
