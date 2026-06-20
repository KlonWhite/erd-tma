function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function welcomeText(client, isNew) {
  const name = escapeHtml(client.first_name || client.username || 'друг');
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
  '🏪 <b>О магазине</b>',
  '',
  'ERD · Ковбои Севера — fashion-бренд с акцентом на верхнюю одежду, худи и базовый гардероб.',
  '',
  '• Официальный Telegram Mini App',
  '• Актуальный каталог и lookbook',
  '• Оформление заказа без выхода из Telegram',
].join('\n');

export const DELIVERY_TERMS = [
  '📦 <b>Условия доставки</b>',
  '',
  '<b>Самовывоз</b> — бесплатно, Москва, ул. Тверская, 15 · Showroom ERD',
  '<b>Курьер</b> — 790 ₽, Москва 1–2 дня, Россия 2–5 дней',
  '<b>Почта</b> — 490 ₽, 5–10 рабочих дней по России',
  '',
  'Оплата: Telegram Payments или наложенный платёж (кроме самовывоза).',
].join('\n');

export const WORKING_HOURS = [
  '🕐 <b>Режим работы</b>',
  '',
  'Showroom ERD · Москва',
  'Пн–Пт: 11:00 – 20:00',
  'Сб: 12:00 – 18:00',
  'Вс: выходной',
  '',
  'Онлайн-заказы через Mini App — круглосуточно.',
].join('\n');

export function profileText(client) {
  const roles = escapeHtml(client.roles.join(', '));
  return [
    '👤 <b>Профиль</b>',
    '',
    `ID: <code>${escapeHtml(client.telegram_id)}</code>`,
    `Имя: ${escapeHtml(client.first_name || '—')}`,
    `Username: ${client.username ? `@${escapeHtml(client.username)}` : '—'}`,
    `Роль: ${roles}`,
    `С нами с: ${escapeHtml(client.created_at)}`,
  ].join('\n');
}

export const HELP_TEXT = [
  '❓ <b>Помощь</b>',
  '',
  '/start — главное меню и клавиатура',
  '«Открыть магазин» — запуск Mini App',
  '«🛟 Техподдержка» — вопрос оператору (ответ в этом чате)',
  '«О магазине» / «Условия доставки» / «Режим работы» — справочная информация',
].join('\n');
