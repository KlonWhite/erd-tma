import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './tokens.css';
import './global.css';
import './tg.js';
import App from './App.jsx';
import useAdminStore from './admin/adminStore.js';
import { isSupabaseConfigured } from './lib/supabase.js';

if (isSupabaseConfigured()) {
  useAdminStore.getState().bootstrap();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
