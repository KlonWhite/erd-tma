/**
 * Геолокация: Telegram WebApp LocationManager или navigator.geolocation.
 * @returns {Promise<{ lat: number, lng: number }>}
 */
export function requestUserLocation() {
  return new Promise((resolve, reject) => {
    const app = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

    if (app?.LocationManager) {
      try {
        app.LocationManager.init(() => {
          if (!app.LocationManager.isLocationAvailable) {
            requestBrowserLocation(resolve, reject);
            return;
          }
          app.LocationManager.getLocation((loc) => {
            if (loc?.latitude != null && loc?.longitude != null) {
              resolve({ lat: loc.latitude, lng: loc.longitude });
            } else {
              requestBrowserLocation(resolve, reject);
            }
          });
        });
        return;
      } catch {
        requestBrowserLocation(resolve, reject);
        return;
      }
    }

    requestBrowserLocation(resolve, reject);
  });
}

function requestBrowserLocation(resolve, reject) {
  if (!navigator?.geolocation) {
    reject(new Error('Геолокация недоступна'));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    },
    (err) => reject(err),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
  );
}
