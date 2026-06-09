import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSupabase } from './supabaseClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
export const PRODUCT_IMAGES_BUCKET = 'product-images';

export function getStoragePublicUrl(storagePath) {
  const base = process.env.SUPABASE_URL?.trim().replace(/\/$/, '');
  if (!base) return null;
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${storagePath.replace(/^\//, '')}`;
}

export async function uploadFileToStorage(localPath, storagePath, contentType) {
  const buffer = fs.readFileSync(localPath);
  const { error } = await getSupabase()
    .storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, buffer, {
      upsert: true,
      contentType: contentType || guessMime(localPath),
    });

  if (error) throw error;
  return getStoragePublicUrl(storagePath);
}

function guessMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };
  return map[ext] ?? 'application/octet-stream';
}

/** '/src/assets/cowboys/9/1.jpg' → локальный путь в проекте */
export function resolveLocalAssetPath(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const normalized = raw.replace(/^\/src\//, 'src/').replace(/^\//, '');
  const full = path.join(ROOT, normalized);
  return fs.existsSync(full) ? full : null;
}

export async function uploadProductImagesFromPaths(imagePaths, productId) {
  const urls = [];
  let index = 0;

  for (const raw of imagePaths ?? []) {
    const local = resolveLocalAssetPath(raw);
    if (!local) continue;

    const ext = path.extname(local).slice(1) || 'jpg';
    const storagePath = `seed/${productId}/${index + 1}.${ext}`;
    index += 1;

    try {
      urls.push(await uploadFileToStorage(local, storagePath));
    } catch (err) {
      console.warn(`[storage] skip ${local}:`, err.message);
    }
  }

  return urls;
}
