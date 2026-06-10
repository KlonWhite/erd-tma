import { getSupabase } from './supabase.js';

function mapProduct(row) {
  const sizes = row.sizes ?? ['ONE SIZE'];
  const stockBySize = row.stock_by_size ?? Object.fromEntries(sizes.map(s => [s, 10]));
  return {
    id: row.id,
    name: row.name,
    subtitle: row.subtitle ?? '',
    price: Number(row.price) || 0,
    collection: row.collection ?? '',
    season: row.season ?? '',
    category: row.category ?? '',
    categoryId: row.category_id ?? 'cat-men',
    archiveTag: row.archive_tag ?? '',
    photoId: row.photo_id ?? null,
    photoKind: row.photo_kind ?? 'product',
    sizes,
    soldSizes: row.sold_sizes ?? [],
    edition: row.edition ?? '',
    description: row.description ?? '',
    images: row.images ?? [],
    stockBySize,
  };
}

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
  };
}

function productToRow(product) {
  return {
    id: product.id,
    name: product.name,
    subtitle: product.subtitle ?? null,
    price: product.price ?? 0,
    collection: product.collection ?? null,
    season: product.season ?? null,
    category: product.category ?? null,
    category_id: product.categoryId ?? null,
    archive_tag: product.archiveTag ?? null,
    photo_id: product.photoId ?? null,
    photo_kind: product.photoKind ?? null,
    sizes: product.sizes ?? ['ONE SIZE'],
    sold_sizes: product.soldSizes ?? [],
    edition: product.edition ?? null,
    description: product.description ?? '',
    images: product.images ?? [],
    stock_by_size: product.stockBySize ?? {},
  };
}

export async function fetchCategories() {
  const { data, error } = await getSupabase()
    .from('categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return (data ?? []).map(mapCategory);
}

export async function fetchProducts() {
  const { data, error } = await getSupabase()
    .from('products')
    .select('*')
    .order('name');

  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function upsertProduct(product) {
  const { data, error } = await getSupabase()
    .from('products')
    .upsert(productToRow(product), { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw error;
  return mapProduct(data);
}

export async function deleteProduct(id) {
  const { error } = await getSupabase().from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertCategory(category) {
  const { data, error } = await getSupabase()
    .from('categories')
    .upsert(
      { id: category.id, name: category.name, slug: category.slug },
      { onConflict: 'id' },
    )
    .select('*')
    .single();

  if (error) throw error;
  return mapCategory(data);
}

export async function deleteCategory(id) {
  const { error } = await getSupabase().from('categories').delete().eq('id', id);
  if (error) throw error;
}
