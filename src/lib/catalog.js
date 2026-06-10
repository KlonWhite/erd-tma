import useAdminStore from '../admin/adminStore.js';
import { PRODUCTS } from '../data/products.js';
import { enrichProductImages } from '../data/productImages.js';

function normalizeList(list) {
  return list.map(enrichProductImages);
}

/** Все товары: Supabase → fallback products.js */
export function getCatalogProducts() {
  const { catalogProducts, initialized } = useAdminStore.getState();
  if (initialized && catalogProducts.length > 0) {
    return normalizeList(catalogProducts);
  }
  return normalizeList(PRODUCTS);
}

export function getProduct(id) {
  if (!id) return null;
  return getCatalogProducts().find(p => p.id === id) ?? null;
}

export function getProductsByCollection(collectionId) {
  const all = getCatalogProducts();
  return all.filter(p => p.collection === collectionId);
}

export function searchProducts(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getCatalogProducts().filter(p =>
    p.name?.toLowerCase().includes(q)
    || p.subtitle?.toLowerCase().includes(q)
    || p.category?.toLowerCase().includes(q),
  );
}
