import { create } from 'zustand';
import { PRODUCTS } from '../data/products.js';
import { DEFAULT_CATEGORIES } from './constants.js';
import { formatPromoLabel } from './promoRegistry.js';
import tg from '../tg.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import {
  deleteCategory as deleteCategoryDb,
  deleteProduct as deleteProductDb,
  fetchCategories,
  fetchProducts,
  upsertCategory,
  upsertProduct,
} from '../lib/catalogDb.js';
import { fetchAdminOrders, updateOrderInDb } from '../lib/ordersDb.js';
import {
  deletePromo as deletePromoDb,
  fetchPromos,
  seedDefaultPromosIfEmpty,
  upsertPromo,
} from '../lib/promosDb.js';

function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeProduct(p) {
  const sizes = p.sizes ?? ['ONE SIZE'];
  const stockBySize = p.stockBySize ?? Object.fromEntries(sizes.map(s => [s, 10]));
  return {
    ...p,
    sizes,
    stockBySize,
    categoryId: p.categoryId ?? 'cat-men',
    images: p.images ?? (p.photoId != null ? [] : []),
    description: p.description ?? '',
  };
}

const useAdminStore = create((set, get) => ({
  initialized: false,
  loading: false,
  error: null,
  adminOrders: [],
  catalogProducts: [],
  categories: DEFAULT_CATEGORIES,
  promos: [],

  async bootstrap() {
    if (get().loading) return;
    if (get().initialized && get().catalogProducts.length > 0) return;

    if (!isSupabaseConfigured()) {
      set({
        initialized: true,
        catalogProducts: PRODUCTS.map(normalizeProduct),
        categories: DEFAULT_CATEGORIES,
        promos: [],
        error: 'Supabase не настроен — используется локальный каталог',
      });
      return;
    }

    set({ loading: true, error: null });
    try {
      const [products, categories, orders, promos] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchAdminOrders(),
        seedDefaultPromosIfEmpty(),
      ]);

      set({
        initialized: true,
        loading: false,
        catalogProducts: products.length ? products : PRODUCTS.map(normalizeProduct),
        categories: categories.length ? categories : DEFAULT_CATEGORIES,
        adminOrders: orders,
        promos,
        error: null,
      });
    } catch (err) {
      console.error('[adminStore] bootstrap:', err);
      set({
        initialized: true,
        loading: false,
        catalogProducts: PRODUCTS.map(normalizeProduct),
        categories: DEFAULT_CATEGORIES,
        adminOrders: [],
        promos: [],
        error: err.message ?? 'Ошибка загрузки данных',
      });
    }
  },

  /** @deprecated use bootstrap */
  initFromSeed() {
    get().bootstrap();
  },

  async registerOrder(payload) {
    const order = {
      id: payload.id,
      createdAt: payload.createdAt ?? new Date().toISOString(),
      status: 'pending',
      customer: payload.customer,
      delivery: payload.delivery,
      shipping: payload.shipping,
      payment: payload.payment,
      items: payload.items,
      subtotal: payload.subtotal,
      shippingCost: payload.shippingCost,
      totalAmount: payload.totalAmount,
      currency: payload.currency ?? 'RUB',
      notifications: [],
    };
    set({ adminOrders: [order, ...get().adminOrders] });
    return order;
  },

  async updateOrderStatus(orderId, status) {
    const orders = get().adminOrders.map(o => {
      if (o.id !== orderId) return o;
      const label = {
        pending: 'НОВЫЙ',
        processing: 'В ОБРАБОТКЕ',
        shipped: 'ОТПРАВЛЕН',
        delivered: 'ДОСТАВЛЕН',
        cancelled: 'ОТМЕНЁН',
      }[status] ?? status;
      const notification = {
        at: new Date().toISOString(),
        message: `Статус заказа ${orderId} изменён на «${label}»`,
      };
      tg.sendOrder({
        type: 'erd_status_notify',
        orderId,
        status,
        customer: o.customer,
        message: notification.message,
      });
      if (import.meta.env.DEV) {
        console.log('[ADMIN] Уведомление клиенту:', notification.message);
      }
      return {
        ...o,
        status,
        notifications: [...(o.notifications ?? []), notification],
      };
    });

    set({ adminOrders: orders });

    if (isSupabaseConfigured()) {
      const target = orders.find(o => o.id === orderId);
      try {
        const updated = await updateOrderInDb(orderId, {
          status,
          notifications: target?.notifications,
        });
        set({
          adminOrders: get().adminOrders.map(o => (o.id === orderId ? updated : o)),
        });
      } catch (err) {
        console.error('[adminStore] updateOrderStatus:', err);
      }
    }
  },

  async updateOrder(orderId, patch) {
    set({
      adminOrders: get().adminOrders.map(o => {
        if (o.id !== orderId) return o;
        const next = { ...o };
        if (patch.status != null) next.status = patch.status;
        if (patch.totalAmount != null) next.totalAmount = Number(patch.totalAmount);
        if (patch.delivery?.address != null) {
          next.delivery = { ...next.delivery, address: patch.delivery.address };
        }
        if (patch.shipping != null) {
          next.shipping = { ...next.shipping, ...patch.shipping };
        }
        return next;
      }),
    });

    if (isSupabaseConfigured()) {
      try {
        const updated = await updateOrderInDb(orderId, patch);
        set({
          adminOrders: get().adminOrders.map(o => (o.id === orderId ? updated : o)),
        });
      } catch (err) {
        console.error('[adminStore] updateOrder:', err);
      }
    }
  },

  getOrder(orderId) {
    return get().adminOrders.find(o => o.id === orderId) ?? null;
  },

  async addProduct(data) {
    const id = data.id ?? uid('p');
    const product = normalizeProduct({ ...data, id });
    set({ catalogProducts: [...get().catalogProducts, product] });
    if (isSupabaseConfigured()) {
      const saved = await upsertProduct(product);
      set({
        catalogProducts: get().catalogProducts.map(p => (p.id === id ? saved : p)),
      });
    }
    return product;
  },

  async updateProduct(id, data) {
    const product = normalizeProduct({
      ...get().catalogProducts.find(p => p.id === id),
      ...data,
      id,
    });
    set({
      catalogProducts: get().catalogProducts.map(p => (p.id === id ? product : p)),
    });
    if (isSupabaseConfigured()) {
      const saved = await upsertProduct(product);
      set({
        catalogProducts: get().catalogProducts.map(p => (p.id === id ? saved : p)),
      });
    }
  },

  async deleteProduct(id) {
    set({ catalogProducts: get().catalogProducts.filter(p => p.id !== id) });
    if (isSupabaseConfigured()) await deleteProductDb(id);
  },

  updateProductStock(id, stockBySize) {
    get().updateProduct(id, { stockBySize });
  },

  async addCategory({ name, slug }) {
    const cat = { id: uid('cat'), name, slug: slug || name.toLowerCase().replace(/\s+/g, '-') };
    set({ categories: [...get().categories, cat] });
    if (isSupabaseConfigured()) {
      const saved = await upsertCategory(cat);
      set({
        categories: get().categories.map(c => (c.id === cat.id ? saved : c)),
      });
    }
    return cat;
  },

  async updateCategory(id, data) {
    const next = get().categories.map(c => (c.id === id ? { ...c, ...data } : c));
    set({ categories: next });
    const cat = next.find(c => c.id === id);
    if (isSupabaseConfigured() && cat) await upsertCategory(cat);
  },

  async deleteCategory(id) {
    set({ categories: get().categories.filter(c => c.id !== id) });
    if (isSupabaseConfigured()) await deleteCategoryDb(id);
  },

  async addPromo(data) {
    const code = String(data.code).trim().toUpperCase();
    if (get().promos.some(p => p.code === code)) {
      throw new Error('Промокод уже существует');
    }
    const type = data.type === 'fixed' ? 'fixed' : 'percent';
    const value = Number(data.value) || 0;
    const promo = {
      id: uid('promo'),
      code,
      type,
      value,
      label: data.label?.trim() || formatPromoLabel({ type, value }),
      minSubtotal: data.minSubtotal ?? null,
      maxUses: data.maxUses != null && data.maxUses !== '' ? Number(data.maxUses) : null,
      expiresAt: data.expiresAt || null,
      active: data.active !== false,
    };
    set({ promos: [...get().promos, promo] });
    if (isSupabaseConfigured()) {
      const saved = await upsertPromo(promo);
      set({ promos: get().promos.map(p => (p.id === promo.id ? saved : p)) });
    }
    return promo;
  },

  async updatePromo(id, data) {
    const promos = get().promos.map(p => {
      if (p.id !== id) return p;
      const next = { ...p, ...data };
      if (data.code) next.code = String(data.code).trim().toUpperCase();
      if (data.type) next.type = data.type === 'fixed' ? 'fixed' : 'percent';
      if (data.value != null) next.value = Number(data.value);
      if (data.maxUses !== undefined) {
        next.maxUses = data.maxUses != null && data.maxUses !== '' ? Number(data.maxUses) : null;
      }
      if (data.expiresAt !== undefined) {
        next.expiresAt = data.expiresAt || null;
      }
      if (!next.label || data.value != null || data.type) {
        next.label = data.label?.trim() || formatPromoLabel(next);
      }
      return next;
    });
    set({ promos });
    if (isSupabaseConfigured()) {
      const promo = promos.find(p => p.id === id);
      if (promo) {
        const saved = await upsertPromo(promo);
        set({ promos: get().promos.map(p => (p.id === id ? saved : p)) });
      }
    }
  },

  async deletePromo(id) {
    set({ promos: get().promos.filter(p => p.id !== id) });
    if (isSupabaseConfigured()) await deletePromoDb(id);
  },
}));

export default useAdminStore;
