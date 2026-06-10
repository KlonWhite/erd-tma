export function welcomeText(client, isNew) {
  const name = client.first_name || client.username || 'друг';
  const intro = isNew
    ? 'Рады видеть вас в ERD · Ковбои Севера.'
    : 'С возвращением в ERD · Ковбои Севера.';

  return [
    `👋 Добро пожаловать, ${name}!`,
    '',
    intro,
    '',
    '🛍️ Нажмите «Открыть магазин», чтобы перейти в мини-приложение.',
    'ℹ️ Также доступны разделы о магазине, доставке и режиме работы.',
  ].join('\n');
}

export const ABOUT_SHOP = [
  '🏪 **О магазине**',
  '',
  'ERD · Ковбои Севера — fashion-бренд с акцентом на верхнюю одежду, худи и базовый гардероб.',
  '',
  '• Официальный Telegram Mini App',
  '• Актуальный каталог и lookbook',
  '• Оформление заказа без выхода из Telegram',
].join('\n');

export const DELIVERY_TERMS = [
  '📦 **Условия доставки**',
  '',
  '**Самовывоз** — бесплатно, Москва, ул. Тверская, 15 · Showroom ERD',
  '**Курьер** — 790 ₽, Москва 1–2 дня, Россия 2–5 дней',
  '**Почта** — 490 ₽, 5–10 рабочих дней по России',
  '',
  'Оплата: Telegram Payments или наложенный платёж (кроме самовывоза).',
].join('\n');

export const WORKING_HOURS = [
  '🕐 **Режим работы**',
  '',
  'Showroom ERD · Москва',
  'Пн–Пт: 11:00 – 20:00',
  'Сб: 12:00 – 18:00',
  'Вс: выходной',
  '',
  'Онлайн-заказы через Mini App — круглосуточно.',
].join('\n');

export function profileText(client) {
  const roles = client.roles.join(', ');
  return [
    '👤 **Профиль**',
    '',
    `ID: \`${client.telegram_id}\``,
    `Имя: ${client.first_name || '—'}`,
    `Username: ${client.username ? `@${client.username}` : '—'}`,
    `Роль: ${roles}`,
    `С нами с: ${client.created_at}`,
  ].join('\n');
}

export const HELP_TEXT = [
  '❓ **Помощь**',
  '',
  '/start — главное меню и клавиатура',
  '«Открыть магазин» — запуск Mini App',
  '«🛟 Техподдержка» — вопрос оператору (ответ в этом чате)',
  '«О магазине» / «Условия доставки» / «Режим работы» — справочная информация',
].join('\n');
