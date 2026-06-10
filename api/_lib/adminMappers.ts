const ADMIN_STATUS_MAP: Record<string, string> = {
  pending: 'pending',
  paid: 'pending',
  accepted: 'processing',
  preparing: 'processing',
  shipping: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
  new: 'pending',
  processing: 'processing',
  shipped: 'shipped',
};

const BOT_STATUS_MAP: Record<string, string> = {
  pending: 'pending',
  processing: 'accepted',
  shipped: 'shipping',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

function parseItems(itemsJson: unknown): unknown[] {
  if (Array.isArray(itemsJson)) return itemsJson;
  try {
    return JSON.parse(String(itemsJson ?? '[]'));
  } catch {
    return [];
  }
}

export function toAdminStatus(status: string | null | undefined): string {
  return ADMIN_STATUS_MAP[status ?? ''] ?? status ?? 'pending';
}

export function toBotStatus(adminStatus: string): string {
  return BOT_STATUS_MAP[adminStatus] ?? adminStatus ?? 'pending';
}

export function rowToAdminOrder(row: Record<string, unknown>) {
  const items = parseItems(row.items_json);
  return {
    id: row.public_id,
    dbId: row.id,
    createdAt: row.created_at,
    status: toAdminStatus(row.status as string),
    customer: row.customer ?? {
      fullName: row.client_name || 'Гость',
      phone: '',
      telegramId: row.client_telegram_id,
      telegramUsername: '',
    },
    delivery: row.delivery ?? {
      fullName: row.client_name || '',
      address: row.address || '',
      phone: '',
    },
    shipping: row.shipping_detail ?? {
      id: row.shipping,
      name: row.shipping,
      cost: Number(row.shipping_cost) || 0,
    },
    payment: row.payment_detail ?? {
      id: row.payment,
      name: row.payment,
      status: 'paid',
    },
    items,
    subtotal: Number(row.subtotal) || 0,
    shippingCost: Number(row.shipping_cost) || 0,
    totalAmount: Number(row.total) || 0,
    currency: row.currency ?? 'RUB',
    notifications: row.notifications ?? [],
  };
}

export function mapProduct(row: Record<string, unknown>) {
  const sizes = (row.sizes as string[]) ?? ['ONE SIZE'];
  const stockBySize = (row.stock_by_size as Record<string, number>)
    ?? Object.fromEntries(sizes.map((s) => [s, 10]));
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

export function productToRow(product: Record<string, unknown>) {
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

export function mapCategory(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
  };
}

export function mapPromo(row: Record<string, unknown>) {
  return {
    id: row.id,
    code: row.code,
    type: row.type === 'fixed' ? 'fixed' : 'percent',
    value: Number(row.value) || 0,
    label: row.label || '',
    minSubtotal: row.min_subtotal != null ? Number(row.min_subtotal) : null,
    maxUses: row.max_uses != null ? Number(row.max_uses) : null,
    expiresAt: row.expires_at ?? null,
    active: row.active !== false,
  };
}

export function promoToRow(promo: Record<string, unknown>) {
  return {
    id: promo.id,
    code: promo.code,
    type: promo.type === 'fixed' ? 'fixed' : 'percent',
    value: promo.value ?? 0,
    label: promo.label ?? '',
    min_subtotal: promo.minSubtotal ?? null,
    max_uses: promo.maxUses ?? null,
    expires_at: promo.expiresAt || null,
    active: promo.active !== false,
  };
}
