import { useEffect, useRef, useState } from 'react';
import Caps from './Caps.jsx';
import { hasYandexMapsKey } from '../utils/yandexGeocode.js';

const DEFAULT_CENTER = [55.7558, 37.6173];
const SCRIPT_ID = 'yandex-maps-script';

function loadYmapsScript(apiKey) {
  if (window.ymaps) return Promise.resolve(window.ymaps);
  const existing = document.getElementById(SCRIPT_ID);
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener('load', () => resolve(window.ymaps));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;
    script.onload = () => resolve(window.ymaps);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/** Интерактивная карта Yandex с маркером точки доставки */
export default function DeliveryMap({ lat, lng, onCoordsChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const placemarkRef = useRef(null);
  const [error, setError] = useState(null);
  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY ?? '';

  const coords = lat != null && lng != null ? [lat, lng] : null;

  useEffect(() => {
    if (!apiKey || !hasYandexMapsKey()) {
      setError('no-key');
      return;
    }

    let cancelled = false;

    loadYmapsScript(apiKey)
      .then((ymaps) => {
        if (cancelled || !containerRef.current) return;

        ymaps.ready(() => {
          if (cancelled || !containerRef.current) return;

          const center = coords ? [coords[0], coords[1]] : DEFAULT_CENTER;
          const zoom = coords ? 16 : 11;

          if (!mapRef.current) {
            mapRef.current = new ymaps.Map(containerRef.current, {
              center,
              zoom,
              controls: ['zoomControl'],
            }, {
              suppressMapOpenBlock: true,
            });

            placemarkRef.current = new ymaps.Placemark(center, {}, {
              preset: 'islands#blackDotIcon',
              draggable: true,
            });
            mapRef.current.geoObjects.add(placemarkRef.current);

            mapRef.current.events.add('click', (e) => {
              const c = e.get('coords');
              placemarkRef.current.geometry.setCoordinates(c);
              onCoordsChange?.(c[0], c[1]);
            });

            placemarkRef.current.events.add('dragend', () => {
              const c = placemarkRef.current.geometry.getCoordinates();
              onCoordsChange?.(c[0], c[1]);
            });
          } else {
            mapRef.current.setCenter(center, zoom);
            placemarkRef.current.geometry.setCoordinates(center);
          }
        });
      })
      .catch(() => setError('load'));

    return () => { cancelled = true; };
  }, [apiKey]);

  useEffect(() => {
    if (!coords || !placemarkRef.current || !mapRef.current) return;
    placemarkRef.current.geometry.setCoordinates(coords);
    mapRef.current.setCenter(coords, 16);
  }, [lat, lng]);

  if (!apiKey || error === 'no-key') {
    const staticLat = coords?.[0] ?? DEFAULT_CENTER[0];
    const staticLng = coords?.[1] ?? DEFAULT_CENTER[1];
    const pt = `${staticLng},${staticLat}`;
    return (
      <div style={{ border: '1px solid var(--erd-rule)', overflow: 'hidden' }}>
        <img
          src={`https://static-maps.yandex.ru/1.x/?ll=${staticLng},${staticLat}&size=650,280&z=15&l=map&pt=${pt},pm2rdm`}
          alt="Карта доставки"
          style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
        />
        <Caps size={8} weight={700} color="var(--erd-muted)" style={{ display: 'block', padding: '8px 10px' }}>
          УКАЖИТЕ АДРЕС ВРУЧНУЮ ИЛИ «МОЯ ЛОКАЦИЯ». ДЛЯ ИНТЕРАКТИВНОЙ КАРТЫ ДОБАВЬТЕ VITE_YANDEX_MAPS_API_KEY
        </Caps>
      </div>
    );
  }

  if (error === 'load') {
    return (
      <div style={{
        height: 200,
        border: '1px solid var(--erd-rule)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}>
        <Caps size={9} weight={700} color="var(--erd-muted)">КАРТА НЕ ЗАГРУЗИЛАСЬ</Caps>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 220,
        border: '1px solid var(--erd-rule)',
      }}
    />
  );
}
