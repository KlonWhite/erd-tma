import { getSupabase } from './supabase.js';

export const PRODUCT_IMAGES_BUCKET = 'product-images';

export function getStoragePublicUrl(path) {
  const base = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '');
  if (!base || !path) return null;
  const clean = String(path).replace(/^\//, '');
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${clean}`;
}

export async function uploadProductImage(file, productId) {
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase();
  const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

  const { error } = await getSupabase()
    .storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });

  if (error) throw error;
  return getStoragePublicUrl(path);
}

export async function uploadProductImages(files, productId) {
  const urls = [];
  for (const file of files) {
    urls.push(await uploadProductImage(file, productId));
  }
  return urls;
}
