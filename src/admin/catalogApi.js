import { getCatalogProducts, getProduct } from '../lib/catalog.js';
import useAdminStore from './adminStore.js';
import { DEFAULT_CATEGORIES } from './constants.js';

export { getCatalogProducts, getProduct };

export function getCatalogProduct(id) {
  return getProduct(id);
}

export function getCategories() {
  const { categories, initialized } = useAdminStore.getState();
  if (initialized && categories.length) return categories;
  return DEFAULT_CATEGORIES;
}
