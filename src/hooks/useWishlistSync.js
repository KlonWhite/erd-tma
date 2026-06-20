import { useEffect, useRef } from 'react';
import useStore from '../store/useStore.js';
import { syncWishlist } from '../lib/wishlistApi.js';
import tg from '../tg.js';

export default function useWishlistSync() {
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current || !tg.isMiniApp) return;
    didRun.current = true;

    const current = useStore.getState().wishlist;
    syncWishlist(current)
      .then((serverWishlist) => {
        if (serverWishlist) {
          useStore.getState().setWishlist(serverWishlist);
        }
      })
      .catch((err) => {
        console.warn('[wishlist] sync:', err);
      });
  }, []);
}
