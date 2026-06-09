import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Caps from '../components/Caps.jsx';
import CTA from '../components/CTA.jsx';

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN ?? 'erd2026';

export function isAdminAuthed() {
  return sessionStorage.getItem('erd-admin-auth') === '1';
}

export function setAdminAuthed(value) {
  if (value) sessionStorage.setItem('erd-admin-auth', '1');
  else sessionStorage.removeItem('erd-admin-auth');
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setAdminAuthed(true);
      navigate('/admin', { replace: true });
    } else {
      setError('НЕВЕРНЫЙ PIN');
    }
  };

  return (
    <div style={{
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px 20px',
      paddingTop: 'calc(24px + var(--safe-top))',
      background: 'var(--erd-ink)',
      color: 'var(--erd-paper)',
    }}>
      <Caps size={9} weight={700} color="rgba(255,255,255,0.6)">ЗАКРЫТЫЙ ДОСТУП</Caps>
      <div style={{
        fontFamily: 'var(--font-sans)',
        fontWeight: 900,
        fontSize: 28,
        marginTop: 8,
        letterSpacing: '-0.02em',
      }}>
        АДМИН-ПАНЕЛЬ
      </div>

      <form onSubmit={submit} style={{ marginTop: 28 }}>
        <Caps size={9} weight={700} color="rgba(255,255,255,0.6)">PIN</Caps>
        <input
          type="password"
          value={pin}
          onChange={e => { setPin(e.target.value); setError(''); }}
          placeholder="••••••"
          style={{
            width: '100%',
            marginTop: 8,
            padding: '12px 0',
            border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.5)',
            background: 'transparent',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            fontSize: 18,
            fontWeight: 700,
            outline: 'none',
          }}
        />
        {error && (
          <Caps size={9} weight={700} color="var(--erd-ox)" style={{ display: 'block', marginTop: 10 }}>
            {error}
          </Caps>
        )}
        <div style={{ marginTop: 24 }}>
          <CTA light onClick={submit}>ВОЙТИ</CTA>
        </div>
      </form>

      <button
        type="button"
        onClick={() => navigate('/home')}
        style={{ marginTop: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
      >
        <Caps size={9} weight={700}>← В МАГАЗИН</Caps>
      </button>
    </div>
  );
}
