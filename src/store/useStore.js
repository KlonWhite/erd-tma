import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEMO_ORDERS = [
  { id: '#ERD-2261', date: '14 MAY 2026', total: '$4,580', status: 'IN TRANSIT' },
  { id: '#ERD-2089', date: '02 APR 2026', total: '$740', status: 'DELIVERED' },
  { id: '#ERD-1822', date: '18 JAN 2026', total: '$6,900', status: 'DELIVERED' },
];

const useStore = create(
  persist(
    (set, get) => ({
      // ── Cart ──────────────────────────────────────────────
      cart: [],

      addToCart(product, size) {
        const { cart } = get();
        const key = `${product.id}__${size}`;
        const existing = cart.find(i => i.key === key);
        if (existing) {
          set({ cart: cart.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i) });
        } else {
          set({ cart: [...cart, { key, product, size, qty: 1 }] });
        }
      },

      removeFromCart(key) {
        set({ cart: get().cart.filter(i => i.key !== key) });
      },

      updateQty(key, delta) {
        const { cart } = get();
        set({
          cart: cart
            .map(i => i.key === key ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
            .filter(i => i.qty > 0),
        });
      },

      clearCart() {
        set({ cart: [] });
      },

      get cartCount() {
        return get().cart.reduce((s, i) => s + i.qty, 0);
      },

      get cartTotal() {
        return get().cart.reduce((s, i) => s + i.product.price * i.qty, 0);
      },

      // ── Wishlist ──────────────────────────────────────────
      wishlist: [],

      toggleWishlist(productId) {
        const { wishlist } = get();
        if (wishlist.includes(productId)) {
          set({ wishlist: wishlist.filter(id => id !== productId) });
        } else {
          set({ wishlist: [...wishlist, productId] });
        }
      },

      isWishlisted(productId) {
        return get().wishlist.includes(productId);
      },

      // ── User ──────────────────────────────────────────────
      user: null,
      setUser(user) { set({ user }); },

      // ── Onboarding ────────────────────────────────────────
      onboardingDone: false,
      setOnboardingDone() { set({ onboardingDone: true }); },

      // ── Orders (persisted; seeded with demo rows) ─────────
      orders: DEMO_ORDERS,

      addOrder(entry) {
        set({ orders: [entry, ...get().orders].slice(0, 40) });
      },
    }),
    {
      name: 'erd-store',
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
        onboardingDone: state.onboardingDone,
        orders: state.orders,
      }),
    }
  )
);

export default useStore;
