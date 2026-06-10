import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Caps from '../../components/Caps.jsx';
import { ADMIN_NAV } from '../constants.js';

export default function AdminShell() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f5f4f0',
      color: 'var(--erd-ink)',
    }}>
      <header style={{
        padding: '12px 16px',
        paddingTop: 'calc(12px + var(--safe-top))',
        background: 'var(--erd-ink)',
        color: 'var(--erd-paper)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Caps size={11} weight={800}>ERD · АДМИН</Caps>
        <button
          type="button"
          onClick={() => navigate('/home')}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', padding: '6px 10px', cursor: 'pointer' }}
        >
          <Caps size={9} weight={700}>В МАГАЗИН</Caps>
        </button>
      </header>

      <nav style={{
        display: 'flex',
        gap: 4,
        overflowX: 'auto',
        padding: '8px 12px',
        background: '#fff',
        borderBottom: '1px solid var(--erd-rule)',
        scrollbarWidth: 'none',
      }}>
        {ADMIN_NAV.map(({ path, label, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            style={({ isActive }) => ({
              padding: '8px 12px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              border: `1px solid ${isActive ? 'var(--erd-ink)' : 'var(--erd-rule)'}`,
              background: isActive ? 'var(--erd-ink)' : 'transparent',
              color: isActive ? 'var(--erd-paper)' : 'var(--erd-ink)',
            })}
          >
            <Caps size={9} weight={700}>{label}</Caps>
          </NavLink>
        ))}
      </nav>

      <main style={{ flex: 1, overflow: 'auto', padding: '16px 12px 24px' }}>
        <Outlet />
      </main>
    </div>
  );
}
