import { adminUploadImage } from './adminApi.js';
import tg from '../tg.js';

export const PRODUCT_IMAGES_BUCKET = 'product-images';

export function getStoragePublicUrl(path) {
  const base = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '');
  if (!base || !path) return null;
  const clean = String(path).replace(/^\//, '');
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${clean}`;
}

export async function uploadProductImage(file, productId) {
  if (tg.app?.initData) {
    return adminUploadImage(file, productId);
  }
  throw new Error('Загрузка изображений доступна только из админ-панели в Telegram');
}

export async function uploadProductImages(files, productId) {
  const urls = [];
  for (const file of files) {
    urls.push(await uploadProductImage(file, productId));
  }
  return urls;
}
