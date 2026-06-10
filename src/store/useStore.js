import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { validatePromo } from '../utils/promo.js';
import { getProduct } from '../lib/catalog.js';
import { computeCartTotals, normalizeCart } from '../utils/cartTotals.js';

function freshProduct(product) {
  if (!product?.id) return product;
  return getProduct(product.id) ?? product;
}

const DEMO_ORDERS = [
  { id: '#ERD-2261', date: '14 MAY 2026', total: '$4,580', status: 'IN TRANSIT' },
  { id: '#ERD-2089', date: '02 APR 2026', total: '$740', status: 'DELIVERED' },
  { id: '#ERD-1822', date: '18 JAN 2026', total: '$6,900', status: 'DELIVERED' },
];

const useStore = create(
  persist(
    (set, get) => ({
      cart: [],

      addToCart(product, size) {
        const { cart } = get();
        const fresh = freshProduct(product);
        const key = `${fresh.id}__${size}`;
        const existing = cart.find(i => i.key === key);
        if (existing) {
          set({
            cart: normalizeCart(cart.map(i => (
              i.key === key
                ? { ...i, qty: i.qty + 1, productId: fresh.id, product: fresh }
                : i
            ))),
          });
        } else {
          set({
            cart: normalizeCart([...cart, {
              key,
              productId: fresh.id,
              product: fresh,
              size,
              qty: 1,
            }]),
          });
        }
      },

      removeFromCart(key) {
        set({ cart: get().cart.filter(i => i.key !== key) });
      },

      updateQty(key, delta) {
        const { cart } = get();
        set({
          cart: normalizeCart(
            cart
              .map(i => i.key === key ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
              .filter(i => i.qty > 0),
          ),
        });
      },

      clearCart() {
        set({ cart: [], promo: null, promoError: null });
      },

      syncCartProducts() {
        const { cart } = get();
        if (!cart.length) return;
        set({ cart: normalizeCart(cart) });
      },

      promo: null,
      promoError: null,

      async applyPromo(code) {
        const { cart } = get();
        const { subtotal } = computeCartTotals(cart, null);
        const result = await validatePromo(code, subtotal);
        if (!result.ok) {
          set({ promo: null, promoError: result.error });
          return false;
        }
        set({ promo: result.promo, promoError: null });
        return true;
      },

      clearPromo() {
        set({ promo: null, promoError: null });
      },

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

      user: null,
      setUser(user) { set({ user }); },

      onboardingDone: false,
      setOnboardingDone() { set({ onboardingDone: true }); },

      delivery: {
        address: '',
        lat: null,
        lng: null,
      },

      setDelivery(partial) {
        set({ delivery: { ...get().delivery, ...partial } });
      },

      orders: DEMO_ORDERS,

      addOrder(entry) {
        set({ orders: [entry, ...get().orders].slice(0, 40) });
      },
    }),
    {
      name: 'erd-store',
      version: 5,
      migrate(persisted) {
        if (persisted?.cart?.length) {
          persisted.cart = normalizeCart(persisted.cart);
        }
        if (!persisted.delivery) {
          persisted.delivery = { address: '', lat: null, lng: null };
        }
        return persisted;
      },
      onRehydrateStorage: () => (state) => {
        if (!state?.cart?.length) return;
        state.cart = normalizeCart(state.cart);
      },
      partialize: (state) => ({
        cart: state.cart.map(({ key, productId, size, qty }) => ({ key, productId, size, qty })),
        wishlist: state.wishlist,
        onboardingDone: state.onboardingDone,
        orders: state.orders,
        promo: state.promo,
        delivery: state.delivery,
      }),
    }
  )
);

export default useStore;
