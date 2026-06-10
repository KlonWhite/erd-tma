export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface OrderItemInput {
  productId: string;
  size: string;
  qty: number;
}

export interface CreateOrderPayload {
  orderId?: string;
  items: OrderItemInput[];
  shipping: string;
  address?: string;
  coords?: { lat: number; lng: number } | null;
  promoCode?: string | null;
  customer?: {
    fullName?: string;
    phone?: string;
    telegramId?: number | null;
    telegramUsername?: string;
  };
  delivery?: {
    fullName?: string;
    address?: string;
    phone?: string;
  };
  payment?: string;
  paymentDetail?: Record<string, unknown>;
}

export interface DbOrder {
  id: number;
  public_id: string;
  client_telegram_id: number | null;
  client_name: string | null;
  status: string;
  shipping: string | null;
  address: string | null;
  coords: Record<string, unknown> | null;
  subtotal: number | null;
  discount: number | null;
  shipping_cost: number | null;
  total: number | null;
  currency: string | null;
  promo_code: string | null;
  items_json: unknown;
  payment: string | null;
  payment_detail: Record<string, unknown> | null;
  customer: Record<string, unknown> | null;
  delivery: Record<string, unknown> | null;
  shipping_detail: Record<string, unknown> | null;
  notifications: Array<Record<string, unknown>>;
  assigned_admin_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbProduct {
  id: string;
  name: string;
  price: number;
  sizes: string[];
  stock_by_size: Record<string, number>;
}

export interface PromoRecord {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  label: string;
  min_subtotal: number | null;
  max_uses: number | null;
  expires_at: string | null;
  active: boolean;
}
