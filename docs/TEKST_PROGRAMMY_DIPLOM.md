# ТЕКСТ ПРОГРАММЫ

## Telegram Mini App магазина ERD (erd-tma)

**Языки и технологии:** JavaScript, TypeScript, React 18, Node.js, PostgreSQL (Supabase), Grammy (Telegram Bot API).

**Среда разработки:** Vite, Vercel Serverless Functions.

---

## 1. Введение

Программный комплекс представляет веб-приложение (Telegram Mini App) для продажи товаров бренда ERD с серверной частью на платформе Vercel и хранением данных в облачной СУБД Supabase (PostgreSQL). Взаимодействие с пользователем осуществляется через клиентское React-приложение, REST API и Telegram-бот.

Архитектура системы разделена на четыре логических уровня:

1. **Клиентский уровень** (`src/`) — интерфейс Mini App, состояние корзины, экраны каталога и оформления заказа.
2. **Серверный API** (`api/`) — serverless-функции: создание заказов, админ-панель, webhook бота.
3. **Общая бизнес-логика** (`shared/`) — проверка Telegram initData, расчёт заказов, авторизация администраторов.
4. **Уровень данных** (`supabase/`) — схема БД, политики RLS, RPC-функция атомарного создания заказа.
5. **Модуль бота** (`bot/`) — обработка команд, уведомления, техподдержка.

Ниже приведены основные модули программы с фрагментами исходного кода.

---

## 2. Модуль маршрутизации клиентского приложения

**Файл:** `src/App.jsx`

**Назначение:** определяет структуру навигации Mini App. Используется `BrowserRouter` и компонент `Routes` библиотеки React Router. При смене URL контейнер экрана перемонтируется, что обеспечивает плавный переход между страницами.

**Листинг 1 – Модуль маршрутизации приложения**

```javascript
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Splash from './screens/Splash.jsx';
import Home from './screens/Home.jsx';
import Collection from './screens/Collection.jsx';
import PDP from './screens/PDP.jsx';
import Cart from './screens/Cart.jsx';
import Checkout from './screens/Checkout.jsx';
import Account from './screens/Account.jsx';
import AdminApp from './admin/AdminApp.jsx';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="erd-route">
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/" element={<Splash />} />
        <Route path="/home" element={<Home />} />
        <Route path="/collection/:id" element={<Collection />} />
        <Route path="/product/:id" element={<PDP />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/account" element={<Account />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
```

---

## 3. Модуль интеграции с Telegram WebApp SDK

**Файл:** `src/tg.js`

**Назначение:** обёртка над объектом `window.Telegram.WebApp`. Выполняет инициализацию Mini App (`ready`, `expand`), применяет тему Telegram к CSS-переменным, учитывает безопасные зоны экрана (notch, Dynamic Island), предоставляет методы haptic feedback, геолокации и отправки данных в бот.

**Листинг 2 – Инициализация Telegram WebApp и темы**

```javascript
const tgApp = window.Telegram?.WebApp;

function applyTelegramTheme() {
  const tp = tgApp?.themeParams;
  if (!tp?.bg_color || !tp?.text_color) return;
  const root = document.documentElement;
  root.style.setProperty('--erd-paper', hexFromTg(tp.bg_color));
  root.style.setProperty('--erd-ink', hexFromTg(tp.text_color));
  const hint = tp.hint_color ? hexFromTg(tp.hint_color) : null;
  if (hint) root.style.setProperty('--erd-muted', hint);
}

function applySafeAreaInsets() {
  const root = document.documentElement;
  const content = tgApp?.contentSafeAreaInset ?? {};
  root.style.setProperty('--tg-content-safe-top', toSafePx(content.top));
  root.style.setProperty('--tg-content-safe-bottom', toSafePx(content.bottom));
}

if (tgApp) {
  tgApp.ready();
  tgApp.expand();
  applyTelegramTheme();
  applySafeAreaInsets();
}

const tg = {
  app: tgApp,
  get user() {
    return tgApp?.initDataUnsafe?.user ?? null;
  },
  get isMiniApp() {
    const initData = tgApp?.initData;
    if (typeof initData === 'string' && initData.length > 0) return true;
    return Boolean(tgApp?.initDataUnsafe?.user?.id);
  },
  haptic: {
    impact(style = 'light') {
      tgApp?.HapticFeedback?.impactOccurred(style);
    },
    notification(type = 'success') {
      tgApp?.HapticFeedback?.notificationOccurred(type);
    },
  },
};

export default tg;
```

---

## 4. Модуль управления состоянием клиента

**Файл:** `src/store/useStore.js`

**Назначение:** централизованное хранилище состояния на базе Zustand с персистентностью в `localStorage`. Управляет корзиной, избранным, промокодами, данными доставки и локальной историей заказов.

**Листинг 3 – Функции работы с корзиной**

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getProduct } from '../lib/catalog.js';
import { computeCartTotals, normalizeCart } from '../utils/cartTotals.js';

const useStore = create(
  persist(
    (set, get) => ({
      cart: [],

      addToCart(product, size) {
        const { cart } = get();
        const fresh = getProduct(product.id) ?? product;
        const key = `${fresh.id}__${size}`;
        const existing = cart.find(i => i.key === key);
        if (existing) {
          set({
            cart: normalizeCart(cart.map(i =>
              i.key === key
                ? { ...i, qty: i.qty + 1, productId: fresh.id, product: fresh }
                : i
            )),
          });
        } else {
          set({
            cart: normalizeCart([...cart, {
              key,
              productId: fresh.id,
              product: fresh,
              size,
              qty: 1,
            }]),
          });
        }
      },

      removeFromCart(key) {
        set({ cart: get().cart.filter(i => i.key !== key) });
      },

      updateQty(key, delta) {
        const { cart } = get();
        set({
          cart: normalizeCart(
            cart
              .map(i => i.key === key ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
              .filter(i => i.qty > 0),
          ),
        });
      },

      clearCart() {
        set({ cart: [], promo: null, promoError: null });
      },
    }),
    { name: 'erd-store' },
  ),
);

export default useStore;
```

---

## 5. Модуль каталога товаров

**Файл:** `src/lib/catalog.js`

**Назначение:** предоставляет единый интерфейс получения товаров. При наличии данных в Supabase использует каталог из `adminStore`; при отсутствии — локальный fallback из `src/data/products.js`. Поддерживает поиск и фильтрацию по коллекциям.

**Листинг 4 – Получение товаров каталога**

```javascript
import useAdminStore from '../admin/adminStore.js';
import { PRODUCTS } from '../data/products.js';
import { enrichProductImages } from '../data/productImages.js';

function normalizeList(list) {
  return list.map(enrichProductImages);
}

export function getCatalogProducts() {
  const { catalogProducts, initialized } = useAdminStore.getState();
  if (initialized && catalogProducts.length > 0) {
    return normalizeList(catalogProducts);
  }
  return normalizeList(PRODUCTS);
}

export function getProduct(id) {
  if (!id) return null;
  return getCatalogProducts().find(p => p.id === id) ?? null;
}

export function searchProducts(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getCatalogProducts().filter(p =>
    p.name?.toLowerCase().includes(q)
    || p.subtitle?.toLowerCase().includes(q)
    || p.category?.toLowerCase().includes(q),
  );
}
```

---

## 6. Модуль оформления заказа (клиент)

**Файлы:** `src/screens/Checkout.jsx`, `src/lib/ordersApi.js`

**Назначение:** формирует объект заказа из корзины, отправляет его на серверный API с подписанным `initData` Telegram, обрабатывает ответ и инициирует уведомление в бот.

**Листинг 5 – Формирование и отправка заказа**

```javascript
// Checkout.jsx — сбор данных заказа
const order = {
  type: 'erd_order',
  orderId,
  items: cart.map(i => ({
    productId: i.productId ?? i.product?.id,
    name: i.product?.name,
    size: i.size,
    qty: i.qty,
    price: i.product?.price,
  })),
  shipping: selectedShipping.id,
  address: delivery.address || deliveryInfo.address,
  coords: delivery.lat != null ? { lat: delivery.lat, lng: delivery.lng } : null,
  subtotal,
  promoCode: promo?.code ?? null,
  discount,
  shippingCost: selectedShipping.price,
  total: orderTotal,
  currency: 'RUB',
  payment: 'demo',
  customer,
  delivery: deliveryInfo,
};

const created = await createOrderViaApi(order);
const finalOrderId = created?.publicId || orderId;
await notifyOrderCreated(finalOrderId);
```

```javascript
// ordersApi.js — HTTP-запрос к серверу
export async function createOrderViaApi(order) {
  const initData = getTelegramInitData() || await waitForTelegramInitData();
  if (!initData) {
    throw new Error('Откройте магазин из Telegram для оформления заказа');
  }

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData, order }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Не удалось оформить заказ');
  }

  return data.order;
}
```

---

## 7. Модуль проверки подлинности Telegram initData

**Файл:** `shared/src/validateInitData.ts`

**Назначение:** серверная проверка подписи данных пользователя Telegram Mini App по алгоритму HMAC-SHA256 (спецификация Telegram Web Apps). При успешной проверке возвращает объект пользователя; при несовпадении подписи или истечении срока — `null`.

**Листинг 6 – Валидация initData (HMAC-SHA256)**

```typescript
import crypto from 'crypto';
import type { TelegramUser } from './types.js';

export function validateTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSec = 86400,
): TelegramUser | null {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculated = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calculated !== hash) return null;

  const authDate = Number(params.get('auth_date'));
  if (authDate && maxAgeSec > 0) {
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > maxAgeSec) return null;
  }

  const userStr = params.get('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as TelegramUser;
  } catch {
    return null;
  }
}
```

---

## 8. Модуль серверного API создания заказа

**Файл:** `api/orders.ts`

**Назначение:** serverless endpoint `POST /api/orders`. Проверяет `initData`, вызывает бизнес-логику создания заказа и возвращает клиенту публичный номер и сумму.

**Листинг 7 – Обработчик HTTP-запроса создания заказа**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createOrderOnServer,
  getServerSupabase,
  validateTelegramInitData,
} from '../shared/dist/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const botToken = process.env.BOT_TOKEN?.trim() ?? '';
    const { initData, order } = req.body;

    if (!initData || !order?.items?.length) {
      res.status(400).json({ error: 'initData and order.items are required' });
      return;
    }

    const user = validateTelegramInitData(initData, botToken);
    if (!user?.id) {
      res.status(401).json({ error: 'Invalid Telegram initData' });
      return;
    }

    const supabase = getServerSupabase();
    const created = await createOrderOnServer(supabase, order, user);

    res.status(200).json({
      ok: true,
      order: {
        publicId: created.public_id,
        dbId: created.id,
        total: created.total,
        status: created.status,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Order creation failed';
    res.status(400).json({ error: message });
  }
}
```

---

## 9. Модуль бизнес-логики создания заказа

**Файл:** `shared/src/orders.ts`

**Назначение:** подготавливает JSON-пayload и вызывает RPC-функцию PostgreSQL `create_order`, обеспечивающую атомарное создание заказа в одной транзакции.

**Листинг 8 – Вызов RPC create_order**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import { getShippingOption } from './shipping.js';

function buildOrderRpcPayload(payload, tgUser) {
  const shippingOption = getShippingOption(payload.shipping);
  return {
    orderId: payload.orderId,
    items: (payload.items ?? [])
      .filter((i) => i.productId && i.qty > 0)
      .map((i) => ({ productId: i.productId, size: i.size, qty: i.qty })),
    shipping: shippingOption.id,
    promoCode: payload.promoCode ?? null,
    address: payload.address ?? null,
    clientTelegramId: tgUser?.id ?? null,
    clientName: tgUser?.first_name ?? null,
  };
}

export async function createOrderOnServer(supabase, payload, tgUser) {
  const items = (payload.items ?? []).filter((i) => i.productId && i.qty > 0);
  if (!items.length) throw new Error('Корзина пуста');

  const p_payload = buildOrderRpcPayload(payload, tgUser);
  const { data, error } = await supabase.rpc('create_order', { p_payload });

  if (error) throw new Error(error.message ?? 'Не удалось создать заказ');
  if (!data) throw new Error('Не удалось создать заказ');

  return data;
}
```

---

## 10. Модуль атомарного создания заказа в СУБД

**Файл:** `supabase/migrations/004_create_order_rpc.sql`

**Назначение:** PostgreSQL-функция `create_order(p_payload JSONB)` выполняет в одной транзакции: проверку наличия товаров и блокировку строк (`FOR UPDATE`), расчёт суммы и скидки по промокоду, списание остатков, записи заказа в таблицу `orders`, инкремент счётчика использования промокода.

**Листинг 9 – Фрагмент RPC-функции create_order**

```sql
CREATE OR REPLACE FUNCTION create_order(p_payload JSONB)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subtotal NUMERIC := 0;
  v_discount NUMERIC := 0;
  v_total NUMERIC := 0;
  v_order orders%ROWTYPE;
BEGIN
  -- Валидация позиций и расчёт subtotal
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_payload->'items')
  LOOP
    SELECT * INTO v_product FROM products
    WHERE id = v_item->>'productId'
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Товар не найден: %', v_item->>'productId';
    END IF;

    v_qty := GREATEST(1, (v_item->>'qty')::integer);
    v_available := COALESCE((v_stock->>v_size)::integer, 0);
    IF v_available < v_qty THEN
      RAISE EXCEPTION 'Недостаточно товара';
    END IF;

    v_subtotal := v_subtotal + v_product.price * v_qty;
    v_stock := jsonb_set(v_stock, ARRAY[v_size],
      to_jsonb(v_available - v_qty), true);
  END LOOP;

  -- Расчёт скидки по промокоду
  v_discount := CASE v_promo.type
    WHEN 'percent' THEN round(v_subtotal * v_promo.value / 100)
    WHEN 'fixed' THEN LEAST(v_subtotal, v_promo.value)
    ELSE 0
  END;

  v_total := GREATEST(0, v_subtotal - v_discount) + v_shipping_cost;

  -- Списание стока и INSERT заказа
  UPDATE products SET stock_by_size = v_line.stock_by_size
  WHERE id = v_line.product_id;

  INSERT INTO orders (public_id, client_telegram_id, status, subtotal,
    discount, shipping_cost, total, items_json, promo_code)
  VALUES (v_public_id, v_client_id, 'pending', v_subtotal,
    v_discount, v_shipping_cost, v_total, v_order_items, v_promo_code)
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;
```

---

## 11. Модуль авторизации администратора

**Файлы:** `shared/src/adminAuth.ts`, `api/admin.ts`

**Назначение:** проверяет, что пользователь Telegram имеет роль `admin` (по списку `ADMIN_TELEGRAM_IDS` или полю `roles` в таблице `clients`). API `/api/admin` обрабатывает действия: `verify`, `bootstrap`, CRUD товаров, заказов и промокодов.

**Листинг 10 – Проверка прав администратора**

```typescript
export async function isTelegramAdmin(supabase, user) {
  if (parseAdminIds().includes(user.id)) return true;

  const { data, error } = await supabase
    .from('clients')
    .select('roles')
    .eq('telegram_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return parseRoles(data?.roles).includes('admin');
}

export async function requireTelegramAdmin(supabase, user) {
  if (!user?.id) throw new Error('Invalid Telegram initData');
  const ok = await isTelegramAdmin(supabase, user);
  if (!ok) throw new Error('Admin access required');
  return user;
}
```

```typescript
// api/admin.ts — обработка запросов админ-панели
const user = validateTelegramInitData(initData, botToken);
if (!user?.id) {
  unauthorized(res, 'Invalid Telegram initData');
  return;
}

if (action === 'verify') {
  const isAdmin = await isTelegramAdmin(supabase, user);
  res.status(200).json({ ok: true, isAdmin, user });
  return;
}

await requireTelegramAdmin(supabase, user);

switch (action) {
  case 'bootstrap': {
    const [productsRes, ordersRes] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
    ]);
    res.status(200).json({
      products: productsRes.data,
      orders: ordersRes.data?.map(rowToAdminOrder),
    });
    break;
  }
  case 'updateOrder': { /* ... */ break; }
  case 'upsertProduct': { /* ... */ break; }
}
```

---

## 12. Модуль Telegram-бота

**Файлы:** `bot/bot.ts`, `bot/handlers/start.js`

**Назначение:** Grammy-бот обрабатывает команды `/start`, текстовые сообщения, callback-кнопки заказов и данные из Mini App (`web_app_data`). При первом входе регистрирует клиента в БД и отображает клавиатуру с кнопкой открытия магазина.

**Листинг 11 – Регистрация обработчиков бота**

```typescript
import { Bot } from 'grammy';
import { BOT_TOKEN } from './config.js';
import { handleStart } from './handlers/start.js';
import { handleWebAppData } from './handlers/webapp.js';
import { handleOrderCallback } from './handlers/orderCallbacks.js';

export function createBot(): Bot {
  const bot = new Bot(BOT_TOKEN);

  bot.command('start', handleStart);
  bot.on('message:web_app_data', (ctx) => handleWebAppData(ctx, bot));

  bot.on('callback_query:data', async (ctx, next) => {
    if (await handleOrderCallback(ctx, bot)) return;
    await next();
  });

  bot.catch((err) => {
    console.error('[bot] error:', err.error ?? err);
  });

  return bot;
}
```

```javascript
// handlers/start.js
export async function handleStart(ctx) {
  const from = ctx.from;
  if (!from) return;

  const { client, isNew } = await upsertClientFromMessage(from);

  await ctx.reply(welcomeText(client, isNew), {
    parse_mode: 'Markdown',
    reply_markup: buildMainKeyboard(client),
  });
}
```

---

## 13. Модуль webhook Telegram-бота

**Файл:** `api/telegram-webhook.ts`

**Назначение:** serverless endpoint для режима webhook. Инициализирует экземпляр бота Grammy (`bot.init()`), получает обновления от Telegram и передаёт их в `handleUpdate`. Используется на production вместо long polling.

**Листинг 12 – Обработчик webhook**

```typescript
import { createBot } from '../bot/bot.js';
import { assertConfig } from '../bot/config.js';

let botInit: Promise<ReturnType<typeof createBot>> | null = null;

function getBot() {
  if (!botInit) {
    botInit = (async () => {
      assertConfig();
      const instance = createBot();
      await instance.init();
      return instance;
    })();
  }
  return botInit;
}

export default async function telegramWebhook(req, res) {
  if (req.method === 'GET') {
    res.status(200).send('ERD bot webhook is active');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const bot = await getBot();
    await bot.handleUpdate(req.body);
    res.status(200).end('ok');
  } catch (err) {
    console.error('[telegram-webhook]', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}
```

---

## 14. Структура основных файлов программы

| № | Модуль | Путь | Функция |
|---|--------|------|---------|
| 1 | Маршрутизация | `src/App.jsx` | Навигация Mini App |
| 2 | Telegram SDK | `src/tg.js` | Интеграция с WebApp API |
| 3 | Состояние | `src/store/useStore.js` | Корзина, wishlist, промо |
| 4 | Каталог | `src/lib/catalog.js` | Получение товаров |
| 5 | Checkout | `src/screens/Checkout.jsx` | Оформление заказа |
| 6 | API-клиент | `src/lib/ordersApi.js` | HTTP к `/api/orders` |
| 7 | Валидация | `shared/src/validateInitData.ts` | Проверка initData |
| 8 | Заказы | `shared/src/orders.ts` | Бизнес-логика заказа |
| 9 | REST API | `api/orders.ts` | Endpoint создания заказа |
| 10 | Админ API | `api/admin.ts` | CRUD и авторизация |
| 11 | Авторизация | `shared/src/adminAuth.ts` | Проверка роли admin |
| 12 | СУБД | `supabase/migrations/004_*.sql` | RPC create_order |
| 13 | Бот | `bot/bot.ts` | Grammy handlers |
| 14 | Webhook | `api/telegram-webhook.ts` | Обработка апдейтов |

---

## 15. Заключение

Программный комплекс реализует полный цикл электронной торговли в экосистеме Telegram: просмотр каталога, управление корзиной, оформление заказа с серверной валидацией, атомарное сохранение в PostgreSQL, уведомления через бот и администрирование через встроенную панель. Разделение на клиент (`src/`), API (`api/`), общую логику (`shared/`) и модуль бота (`bot/`) обеспечивает модульность, тестируемость и возможность независимого развёртывания компонентов на платформе Vercel.

---

*Примечание для оформления в Word:* рекомендуется шрифт Times New Roman 14 pt, межстрочный интервал 1,5, поля по ГОСТ. Листинги оформить как «Листинг 1», «Листинг 2» и т.д. Код — шрифт Courier New 10–11 pt. При необходимости сократить объём — убрать листинги 4 и 11; при необходимости расширить — добавить модуль `notify-order.ts` и схему таблицы `orders` из `001_initial_schema.sql`.
