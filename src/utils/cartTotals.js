import { getProduct } from '../lib/catalog.js';
import { calcPromoDiscount } from '../utils/promo.js';

function resolveItemProduct(item) {
  const id = item?.productId ?? item?.product?.id;
  if (id) return getProduct(id) ?? item?.product;
  return item?.product;
}

export function computeCartTotals(cart, promo) {
  const subtotal = (cart ?? []).reduce((sum, item) => {
    const product = resolveItemProduct(item);
    const price = Number(product?.price) || 0;
    const qty = Number(item?.qty) || 0;
    return sum + price * qty;
  }, 0);

  const discount = calcPromoDiscount(subtotal, promo);
  const total = Math.max(0, subtotal - discount);

  return { subtotal, discount, total };
}

export function normalizeCartItem(item) {
  const product = resolveItemProduct(item);
  if (!product?.id) return item;
  return {
    key: item.key,
    productId: product.id,
    product,
    size: item.size,
    qty: item.qty,
  };
}

export function normalizeCart(cart) {
  return (cart ?? []).map(normalizeCartItem).filter(i => i?.product?.id);
}
