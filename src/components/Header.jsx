import { useNavigate } from 'react-router-dom';
import Wordmark from './Wordmark.jsx';
import Caps from './Caps.jsx';
import useStore from '../store/useStore.js';
import tg from '../tg.js';

export default function Header({ dark = false }) {
  const navigate = useNavigate();
  const cart = useStore(s => s.cart);
  const cartCount = cart.reduce((a, i) => a + i.qty, 0);
  const c = dark ? 'var(--erd-paper)' : 'var(--erd-ink)';
  const border = dark ? 'rgba(255,255,255,0.15)' : 'var(--erd-rule)';

  const go = (path) => {
    tg.haptic.selection();
    navigate(path);
  };

  return (
    <div
      className="erd-app-header"
      style={{ borderBottom: `1px solid ${border}` }}
    >
      <Wordmark size={11} color={c} />
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <button onClick={() => go('/search')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Caps size={10} weight={700} color={c}>ПОИСК</Caps>
        </button>
        <button onClick={() => go('/cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Caps size={10} weight={700} color={c}>КОРЗИНА ({cartCount})</Caps>
        </button>
      </div>
    </div>
  );
}
