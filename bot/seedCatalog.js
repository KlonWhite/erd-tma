import { assertConfig } from './config.js';
import { getSupabase } from './supabaseClient.js';
import { uploadProductImagesFromPaths } from './storage.js';
import { DEFAULT_CATEGORIES } from '../src/admin/constants.js';
import { DEFAULT_PROMOS } from '../src/admin/defaultPromos.js';
import { PRODUCTS } from '../src/data/products.js';

assertConfig();

const supabase = getSupabase();

function productToRow(p, images) {
  const sizes = p.sizes ?? ['ONE SIZE'];
  return {
    id: p.id,
    name: p.name,
    subtitle: p.subtitle ?? null,
    price: p.price ?? 0,
    collection: p.collection ?? null,
    season: p.season ?? null,
    category: p.category ?? null,
    category_id: p.category?.includes('ACCESSOR') ? 'cat-accessories'
      : p.collection === 'femme' ? 'cat-women'
        : p.collection === 'cowboys' ? 'cat-men'
          : 'cat-men',
    archive_tag: p.archiveTag ?? null,
    photo_id: p.photoId ?? null,
    photo_kind: p.photoKind ?? null,
    sizes,
    sold_sizes: p.soldSizes ?? [],
    edition: p.edition ?? null,
    description: p.description ?? '',
    images: images ?? [],
    stock_by_size: Object.fromEntries(sizes.map(s => [s, 10])),
  };
}

function promoToRow(p) {
  return {
    id: p.id,
    code: p.code,
    type: p.type,
    value: p.value,
    label: p.label,
    min_subtotal: p.minSubtotal ?? null,
    max_uses: p.maxUses ?? null,
    expires_at: p.expiresAt || null,
    active: p.active !== false,
  };
}

const { count: catCount } = await supabase
  .from('categories')
  .select('*', { count: 'exact', head: true });

if (!catCount) {
  const { error } = await supabase.from('categories').insert(DEFAULT_CATEGORIES);
  if (error) throw error;
  console.log(`[seed-catalog] категорий: ${DEFAULT_CATEGORIES.length}`);
} else {
  console.log('[seed-catalog] категории уже есть — пропуск');
}

const { count: prodCount } = await supabase
  .from('products')
  .select('*', { count: 'exact', head: true });

if (!prodCount) {
  const rows = [];
  for (const p of PRODUCTS) {
    const sourcePaths = p.images?.length
      ? p.images
      : [];
    const uploaded = sourcePaths.length
      ? await uploadProductImagesFromPaths(sourcePaths, p.id)
      : [];
    rows.push(productToRow(p, uploaded));
  }

  const { error } = await supabase.from('products').insert(rows);
  if (error) throw error;
  const withImages = rows.filter(r => r.images?.length).length;
  console.log(`[seed-catalog] товаров: ${rows.length} (с фото в Storage: ${withImages})`);
} else {
  console.log('[seed-catalog] товары уже есть — пропуск');
}

const { count: promoCount } = await supabase
  .from('promos')
  .select('*', { count: 'exact', head: true });

if (!promoCount) {
  const rows = DEFAULT_PROMOS.map(promoToRow);
  const { error } = await supabase.from('promos').insert(rows);
  if (error) throw error;
  console.log(`[seed-catalog] промокодов: ${rows.length}`);
} else {
  console.log('[seed-catalog] промокоды уже есть — пропуск');
}

console.log('[seed-catalog] готово');
