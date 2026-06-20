import { useNavigate, useLocation } from 'react-router-dom';
import Caps from './Caps.jsx';
import tg from '../tg.js';

const NAV_ITEMS = [
  { path: '/home', label: 'ГЛАВНАЯ', icon: '⌂', isActive: (p) => p === '/home' || p === '/' },
  { path: '/lookbook/fw26', label: 'ЛУКБУК', icon: '▷', isActive: (p) => p.startsWith('/lookbook') },
  { path: '/wishlist', label: 'ИЗБРАННОЕ', icon: '♡', isActive: (p) => p === '/wishlist' },
  { path: '/account', label: 'АККАУНТ', icon: '○', isActive: (p) => p === '/account' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const go = (path) => {
    tg.haptic.selection();
    navigate(path);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'var(--erd-paper)',
      borderTop: '1px solid var(--erd-rule)',
      display: 'flex',
      paddingBottom: 'var(--safe-bottom)',
      paddingLeft: 'var(--safe-left)',
      paddingRight: 'var(--safe-right)',
    }}>
      {NAV_ITEMS.map(({ path, label, isActive }) => {
        const active = isActive(location.pathname);
        return (
          <button
            key={path}
            onClick={() => go(path)}
            className="erd-press"
            style={{
              flex: 1,
              padding: '12px 0 10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Caps
              size={9}
              weight={active ? 800 : 700}
              color={active ? 'var(--erd-ink)' : 'var(--erd-muted)'}
            >
              {label}
            </Caps>
            {active && (
              <div style={{ width: 16, height: 1, background: 'var(--erd-ink)' }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
