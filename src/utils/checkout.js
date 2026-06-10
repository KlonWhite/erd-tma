/** Способы доставки по ТЗ */
export const SHIPPING_OPTIONS = [
  {
    id: 'pickup',
    name: 'САМОВЫВОЗ',
    days: 'ГОТОВНОСТЬ 1–2 ДНЯ · ТВЕРСКАЯ, 15',
    price: 0,
    label: 'БЕСПЛАТНО',
    needsAddress: false,
    pickupAddress: 'МОСКВА, УЛ. ТВЕРСКАЯ, 15 · SHOWROOM ERD',
  },
  {
    id: 'courier',
    name: 'ДОСТАВКА',
    days: 'КУРЬЕР · МОСКВА И МО',
    price: 790,
    label: '790 ₽',
    needsAddress: true,
    showMap: true,
    eta: '45–60 МИН',
  },
  {
    id: 'postal',
    name: 'ПОЧТОВАЯ ДОСТАВКА',
    days: '5–10 РАБОЧИХ ДНЕЙ · ПО РОССИИ',
    price: 490,
    label: '490 ₽',
    needsAddress: true,
    showMap: false,
  },
];

export function getShippingOption(id) {
  return SHIPPING_OPTIONS.find(o => o.id === id) ?? SHIPPING_OPTIONS[0];
}

export function shippingNeedsAddress(shippingId) {
  return getShippingOption(shippingId).needsAddress;
}
