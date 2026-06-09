/** Поиск по строковым полям (регистронезависимо). */
export function matchSearch(query, fields) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some(f => String(f ?? '').toLowerCase().includes(q));
}

/**
 * @template T
 * @param {T[]} items
 * @param {string} sortKey
 * @param {Record<string, (a: T, b: T) => number>} comparators
 */
export function sortItems(items, sortKey, comparators) {
  const cmp = comparators[sortKey];
  if (!cmp) return [...items];
  return [...items].sort(cmp);
}

export const cmpStr = (a, b) => String(a).localeCompare(String(b), 'ru');
export const cmpNum = (a, b) => (Number(a) || 0) - (Number(b) || 0);
export const cmpDate = (a, b) => new Date(a).getTime() - new Date(b).getTime();
