export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  needsAddress: boolean;
  pickupAddress?: string;
}

export const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 'pickup',
    name: 'САМОВЫВОЗ',
    price: 0,
    needsAddress: false,
    pickupAddress: 'МОСКВА, УЛ. ТВЕРСКАЯ, 15 · SHOWROOM ERD',
  },
  {
    id: 'courier',
    name: 'ДОСТАВКА',
    price: 790,
    needsAddress: true,
  },
  {
    id: 'postal',
    name: 'ПОЧТОВАЯ ДОСТАВКА',
    price: 490,
    needsAddress: true,
  },
];

export function getShippingOption(id: string): ShippingOption {
  return SHIPPING_OPTIONS.find((o) => o.id === id) ?? SHIPPING_OPTIONS[0];
}
