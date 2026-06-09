import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAdminAuthed } from './AdminLogin.jsx';
import useAdminStore from './adminStore.js';

export default function AdminGuard() {
  const bootstrap = useAdminStore(s => s.bootstrap);
  const loading = useAdminStore(s => s.loading);
  const error = useAdminStore(s => s.error);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (!isAdminAuthed()) {
    return <Navigate to="/admin/login" replace />;
  }

  if (loading) {
    return (
      <div style={{ padding: 24, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        Загрузка данных…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--erd-ox)' }}>
        {error}
      </div>
    );
  }

  return <Outlet />;
}
