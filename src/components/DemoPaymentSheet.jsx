import { useEffect, useState, useRef } from 'react';
import Caps from './Caps.jsx';
import tg from '../tg.js';

const PROCESS_MS = 2800;

export default function DemoPaymentSheet({
  open,
  amount,
  currency = 'RUB',
  onSuccess,
  onClose,
}) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('processing');
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const formattedAmount = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

  const currencyLabel = currency === 'RUB' ? '₽' : currency;

  useEffect(() => {
    if (!open) {
      setProgress(0);
      setPhase('processing');
      return;
    }

    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / PROCESS_MS) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(tick);
        setPhase('success');
        tg.haptic.notification('success');
        setTimeout(() => onSuccessRef.current?.(), 600);
      }
    }, 40);

    return () => clearInterval(tick);
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    if (phase === 'processing') {
      tg.haptic.impact('light');
      onClose?.();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'rgba(0,0,0,0.45)',
      }}
      onClick={handleClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          paddingBottom: 'calc(20px + var(--safe-bottom))',
          maxHeight: '85vh',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 20px 14px',
          borderBottom: '1px solid var(--erd-rule)',
        }}>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 800,
            fontSize: 18,
            letterSpacing: '-0.02em',
          }}>
            Демо-оплата
          </span>
          <button
            type="button"
            onClick={handleClose}
            disabled={phase === 'success'}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1px solid var(--erd-rule)',
              background: '#fff',
              cursor: phase === 'processing' ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: 'var(--erd-muted)',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{
          padding: '36px 24px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}>
            {phase === 'success' ? (
              <span style={{ fontSize: 32, color: '#2563eb' }}>✓</span>
            ) : (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="2" y="5" width="20" height="14" rx="2" stroke="#2563eb" strokeWidth="1.5" />
                <path d="M2 9h20" stroke="#2563eb" strokeWidth="1.5" />
                <rect x="5" y="13" width="6" height="2" rx="0.5" fill="#2563eb" />
              </svg>
            )}
          </div>

          <div style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}>
            {phase === 'success' ? 'Оплата прошла' : 'Обработка оплаты'}
          </div>

          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--erd-muted)',
            lineHeight: 1.45,
            maxWidth: 280,
          }}>
            {phase === 'success'
              ? 'Демо-платёж успешно завершён. Оформляем заказ...'
              : 'Проводим безопасную проверку платежа...'}
          </div>

          <div style={{
            width: '100%',
            maxWidth: 320,
            height: 4,
            background: 'rgba(0,0,0,0.08)',
            borderRadius: 4,
            marginTop: 28,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: phase === 'success' ? '#22c55e' : 'rgba(0,0,0,0.25)',
              borderRadius: 4,
              transition: 'width 0.08s linear, background 0.3s',
            }} />
          </div>

          <div style={{
            marginTop: 28,
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            color: 'var(--erd-muted)',
          }}>
            Сумма:{' '}
            <span style={{ fontWeight: 800, color: 'var(--erd-ink)' }}>
              {formattedAmount} {currencyLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
