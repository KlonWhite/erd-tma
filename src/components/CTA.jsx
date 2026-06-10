import Caps from './Caps.jsx';
import tg from '../tg.js';

export default function CTA({ children, light = false, onClick, disabled = false, style }) {
  const handleClick = () => {
    if (disabled) return;
    tg.haptic.impact('medium');
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={{
        width: '100%',
        background: disabled ? 'rgba(0,0,0,0.2)' : (light ? 'var(--erd-paper)' : 'var(--erd-ink)'),
        color: light ? 'var(--erd-ink)' : 'var(--erd-paper)',
        border: light ? '1px solid var(--erd-ink)' : 'none',
        padding: '16px 0',
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      <Caps size={11} weight={700} style={{ letterSpacing: '0.08em' }}>{children}</Caps>
    </button>
  );
}
