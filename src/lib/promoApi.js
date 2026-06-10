/** Серверная валидация промокода (лимиты, срок, usage). */
export async function validatePromoViaApi(code, subtotal) {
  const res = await fetch('/api/promo-validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, subtotal }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error || 'Ошибка проверки промокода' };
  }

  if (!data.ok) {
    return { ok: false, error: data.error || 'Промокод недоступен' };
  }

  return {
    ok: true,
    promo: data.promo,
    discount: data.discount,
  };
}
