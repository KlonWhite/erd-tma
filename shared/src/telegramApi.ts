export async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string,
  replyMarkup?: Record<string, unknown>,
): Promise<unknown> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (replyMarkup) body.reply_markup = replyMarkup;

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  return res.json();
}

export function adminOrderKeyboard(orderDbId: number) {
  return {
    inline_keyboard: [
      [{ text: '✅ Принять заказ', callback_data: `order_accept:${orderDbId}` }],
      [{ text: '👁️ Детали заказа', callback_data: `order_detail:${orderDbId}` }],
    ],
  };
}
