import { getCatalogProducts, getProduct } from '../lib/catalog.js';

export const COLLECTIONS = [
  {
    id: 'homme',
    label: 'HOMME',
    season: 'F/W 26',
    headline: 'HOMME — F/W 26',
    filters: ['ВСЕ', 'OUTERWEAR', 'KNITWEAR', 'SHIRTING', 'TROUSERS', 'ACCESSORIES'],
    photoId: 2,
    productIds: ['p001', 'p003', 'p005', 'p007', 'p008'],
  },
  {
    id: 'cowboys',
    label: 'КОВБОИ СЕВЕРА',
    season: 'S/S 26',
    headline: 'КОВБОИ СЕВЕРА — S/S 26',
    filters: ['ВСЕ', 'ВЕРХНЯЯ ОДЕЖДА', 'ФУТБОЛКИ И ЛОНГСЛИВЫ', 'ТОЛСТОВКИ И ХУДИ', 'БРЮКИ'],
    photoId: null,
    productIds: ['c001', 'c002', 'c003', 'c004', 'c005', 'c006', 'c007', 'c008', 'c009', 'c010', 'c011', 'c012', 'c013'],
  },
  {
    id: 'femme',
    label: 'FEMME',
    season: 'F/W 26',
    headline: 'FEMME — F/W 26',
    filters: ['ВСЕ', 'OUTERWEAR', 'KNITWEAR', 'SHIRTING', 'ACCESSORIES'],
    photoId: 4,
    productIds: ['p002', 'p004', 'p006'],
  },
  {
    id: 'archive',
    label: 'АРХИВ',
    season: 'ВСЕ СЕЗОНЫ',
    headline: 'АРХИВ',
    filters: ['ВСЕ', 'S/S 25', 'F/W 25', 'S/S 24', 'F/W 24'],
    photoId: 0,
    productIds: ['p001', 'p002', 'p003', 'p004', 'p005', 'p006', 'p007', 'p008'],
  },
];

export function getCollection(id) {
  const col = COLLECTIONS.find(c => c.id === id);
  if (!col) return null;

  let products = col.productIds.map(pid => getProduct(pid)).filter(Boolean);

  if (!products.length) {
    products = getCatalogProducts().filter(p => p.collection === id);
  }

  if (id === 'archive' && !products.length) {
    products = getCatalogProducts().filter(p => p.archiveTag);
  }

  return { ...col, products };
}
