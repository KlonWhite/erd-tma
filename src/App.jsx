import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Splash from './screens/Splash.jsx';
import Onboarding from './screens/Onboarding.jsx';
import Home from './screens/Home.jsx';
import Collection from './screens/Collection.jsx';
import PDP from './screens/PDP.jsx';
import Lookbook from './screens/Lookbook.jsx';
import Cart from './screens/Cart.jsx';
import Checkout from './screens/Checkout.jsx';
import Account from './screens/Account.jsx';
import Search from './screens/Search.jsx';
import Wishlist from './screens/Wishlist.jsx';
import Stockists from './screens/Stockists.jsx';
import AdminApp from './admin/AdminApp.jsx';
import useWishlistSync from './hooks/useWishlistSync.js';

const shell = { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%' };

function AnimatedRoutes() {
  const location = useLocation();

  return (
    // key по pathname перемонтирует контейнер → срабатывает erd-screen-in
    <div key={location.pathname} className="erd-route" style={shell}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/" element={<Splash />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/home" element={<Home />} />
        <Route path="/collection/:id" element={<Collection />} />
        <Route path="/product/:id" element={<PDP />} />
        <Route path="/lookbook/:id" element={<Lookbook />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/account" element={<Account />} />
        <Route path="/search" element={<Search />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/stores" element={<Stockists />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  useWishlistSync();

  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
