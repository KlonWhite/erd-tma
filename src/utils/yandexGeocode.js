const API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY ?? '';

/**
 * Обратное геокодирование: координаты → текстовый адрес (Yandex Geocoder API).
 * @returns {Promise<string | null>}
 */
export async function reverseGeocode(lat, lng) {
  if (!API_KEY) {
    return formatFallbackAddress(lat, lng);
  }

  const geocode = `${lng},${lat}`;
  const url = new URL('https://geocode-maps.yandex.ru/1.x/');
  url.searchParams.set('apikey', API_KEY);
  url.searchParams.set('geocode', geocode);
  url.searchParams.set('format', 'json');
  url.searchParams.set('lang', 'ru_RU');
  url.searchParams.set('results', '1');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Geocoder request failed');

  const data = await res.json();
  const member = data?.response?.GeoObjectCollection?.featureMember?.[0];
  const text = member?.GeoObject?.metaDataProperty?.GeocoderMetaData?.text;
  return text || formatFallbackAddress(lat, lng);
}

function formatFallbackAddress(lat, lng) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function hasYandexMapsKey() {
  return Boolean(API_KEY);
}
