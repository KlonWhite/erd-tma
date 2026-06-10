import { getStoragePublicUrl } from '../lib/storage.js';

/** Vite-resolved URLs для локальных фото cowboys (dev/dist fallback) */
const ASSETS = import.meta.glob('../assets/cowboys/**/*.{jpg,JPG,png,PNG,webp}', {
  eager: true,
  import: 'default',
});

function assetUrl(relativePath) {
  const key = `../assets/cowboys/${relativePath}`;
  if (ASSETS[key]) return ASSETS[key];
  const alt = Object.keys(ASSETS).find(k => k.toLowerCase() === key.toLowerCase());
  return alt ? ASSETS[alt] : null;
}

function isRemoteUrl(src) {
  return typeof src === 'string' && /^https?:\/\//i.test(src);
}

/** @param {string} raw — URL или '/src/assets/cowboys/1/1.jpg' */
export function resolveImagePath(raw) {
  if (!raw || typeof raw !== 'string') return raw;
  if (isRemoteUrl(raw)) return raw;

  if (raw.includes('product-images/')) {
    const path = raw.split('product-images/').pop();
    return getStoragePublicUrl(path) ?? raw;
  }

  const m = raw.match(/cowboys\/(\d+\/[^/]+)$/i);
  if (m) return assetUrl(m[1]) ?? raw;

  return raw;
}

export function resolveProductImages(product) {
  if (product?.images?.length) {
    return product.images.map(resolveImagePath).filter(Boolean);
  }
  return null;
}

export function enrichProductImages(product) {
  if (!product) return product;
  const images = resolveProductImages(product);
  return images?.length ? { ...product, images } : product;
}

export function getProductImage(product) {
  const images = resolveProductImages(product);
  if (images?.length) return images[0];
  return null;
}
