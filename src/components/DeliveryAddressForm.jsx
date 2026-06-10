import { useState } from 'react';
import Caps from './Caps.jsx';
import DeliveryMap from './DeliveryMap.jsx';
import tg from '../tg.js';
import { reverseGeocode } from '../utils/yandexGeocode.js';

const fieldStyle = {
  width: '100%',
  fontFamily: 'var(--font-sans)',
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  border: '1px solid var(--erd-rule)',
  padding: '12px 14px',
  background: 'var(--erd-paper)',
  color: 'var(--erd-ink)',
  outline: 'none',
  resize: 'vertical',
  minHeight: 72,
  lineHeight: 1.5,
};

export default function DeliveryAddressForm({
  address,
  lat,
  lng,
  onAddressChange,
  onCoordsChange,
  showMap = true,
  eta = '45–60 МИН',
}) {
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const applyCoords = async (newLat, newLng, saveAddress = true) => {
    onCoordsChange?.(newLat, newLng);
    if (!saveAddress) return;

    setLoading(true);
    setGeoError(null);
    try {
      const text = await reverseGeocode(newLat, newLng);
      if (text) onAddressChange(text);
      tg.haptic.notification('success');
    } catch {
      setGeoError('Не удалось определить адрес. Введите вручную.');
      tg.haptic.notification('error');
    } finally {
      setLoading(false);
    }
  };

  const handleMyLocation = async () => {
    setLoading(true);
    setGeoError(null);
    tg.haptic.selection();

    try {
      const { lat: newLat, lng: newLng } = await tg.requestLocation();
      await applyCoords(newLat, newLng, true);
    } catch {
      setGeoError('Разрешите доступ к геолокации в Telegram или браузере.');
      tg.haptic.notification('error');
      setLoading(false);
    }
  };

  const handleMapCoords = (newLat, newLng) => {
    applyCoords(newLat, newLng, true);
  };

  return (
    <div style={{ padding: '0 18px 16px' }}>
      <Caps size={9} weight={700} color="var(--erd-muted)">АДРЕС ДОСТАВКИ</Caps>

      {showMap && (
        <div style={{ marginTop: 12 }}>
          <DeliveryMap lat={lat} lng={lng} onCoordsChange={handleMapCoords} />
          <Caps size={8} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 6 }}>
            НАЖМИТЕ НА КАРТУ ИЛИ ПЕРЕТАЩИТЕ МАРКЕР
          </Caps>
        </div>
      )}

      <textarea
        value={address}
        onChange={e => onAddressChange(e.target.value)}
        placeholder="УЛИЦА, ДОМ, ПОДЪЕЗД, КВАРТИРА"
        style={{ ...fieldStyle, marginTop: 14 }}
      />

      <button
        type="button"
        onClick={handleMyLocation}
        disabled={loading}
        style={{
          width: '100%',
          marginTop: 10,
          padding: '12px 14px',
          border: '1px solid var(--erd-ink)',
          background: 'transparent',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        <Caps size={10} weight={800}>
          {loading ? 'ОПРЕДЕЛЯЕМ...' : '📍 МОЯ ЛОКАЦИЯ'}
        </Caps>
      </button>

      {geoError && (
        <Caps size={8} weight={700} color="var(--erd-ox)" style={{ display: 'block', marginTop: 8 }}>
          {geoError}
        </Caps>
      )}

      <div style={{
        marginTop: 14,
        padding: '10px 12px',
        border: '1px solid var(--erd-rule)',
        background: 'rgba(0,0,0,0.03)',
      }}>
        <Caps size={9} weight={700} color="var(--erd-muted)">
          СРЕДНЕЕ ВРЕМЯ ДОСТАВКИ: {eta}
        </Caps>
      </div>
    </div>
  );
}
