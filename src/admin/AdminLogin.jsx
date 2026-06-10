import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Caps from '../components/Caps.jsx';
import CTA from '../components/CTA.jsx';
import { verifyAdminAccess } from '../lib/adminApi.js';
import tg from '../tg.js';

const AUTH_KEY = 'erd-admin-auth';

export function isAdminAuthed() {
  return sessionStorage.getItem(AUTH_KEY) === '1';
}

export function setAdminAuthed(value) {
  if (value) sessionStorage.setItem(AUTH_KEY, '1');
  else sessionStorage.removeItem(AUTH_KEY);
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!tg.isAvailable) {
        setError('Откройте админ-панель из Telegram Mini App');
        setChecking(false);
        return;
      }

      try {
        const result = await verifyAdminAccess();
        if (cancelled) return;

        if (result.isAdmin) {
          setAdminAuthed(true);
          navigate('/admin', { replace: true });
          return;
        }

        setError(result.error || 'Нет прав администратора');
      } catch (err) {
        if (!cancelled) {
          setError(err.message ?? 'Ошибка проверки доступа');
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    check();
    return () => { cancelled = true; };
  }, [navigate]);

  const retry = () => {
    setChecking(true);
    setError('');
    window.location.reload();
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
      <Caps size={10} weight={700} color="var(--erd-muted)">ERD ADMIN</Caps>
      <div style={{
        fontFamily: 'var(--font-sans)',
        fontWeight: 900,
        fontSize: 28,
        marginTop: 8,
        letterSpacing: '-0.01em',
      }}>
        ДОСТУП
      </div>

      {checking && (
        <Caps size={10} weight={700} style={{ marginTop: 24, display: 'block' }}>
          ПРОВЕРКА TELEGRAM ID…
        </Caps>
      )}

      {!checking && error && (
        <>
          <Caps size={10} weight={700} color="var(--erd-ox)" style={{ marginTop: 24, display: 'block', lineHeight: 1.6 }}>
            {error}
          </Caps>
          <div style={{ marginTop: 24 }}>
            <CTA onClick={retry}>ПОВТОРИТЬ</CTA>
          </div>
        </>
      )}
    </div>
  );
}
