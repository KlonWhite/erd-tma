/** Ожидание сообщения от клиента / ответа админа (in-memory). */

const awaitingClient = new Set();
const adminReplyTo = new Map();

export function setAwaitingSupport(telegramId) {
  awaitingClient.add(telegramId);
}

export function clearAwaitingSupport(telegramId) {
  awaitingClient.delete(telegramId);
}

export function isAwaitingSupport(telegramId) {
  return awaitingClient.has(telegramId);
}

export function setAdminReply(adminId, dialogueId) {
  adminReplyTo.set(adminId, dialogueId);
}

export function getAdminReply(adminId) {
  return adminReplyTo.get(adminId);
}

export function clearAdminReply(adminId) {
  adminReplyTo.delete(adminId);
}
