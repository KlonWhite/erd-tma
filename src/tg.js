// Telegram WebApp SDK wrapper
const tgApp = window.Telegram?.WebApp;

function applyFixedLightTheme() {
  const root = document.documentElement;
  root.style.setProperty('--erd-paper', '#ffffff');
  root.style.setProperty('--erd-ink', '#000000');
  root.style.setProperty('--erd-ox', '#7a0d0d');
  root.style.setProperty('--erd-rule', 'rgba(0, 0, 0, 0.12)');
  root.style.setProperty('--erd-muted', 'rgba(0, 0, 0, 0.55)');
}

function toSafePx(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? `${n}px` : '0px';
}

/** Чёлка, Dynamic Island, панель Telegram — Bot API 7.7+ contentSafeAreaInset */
function applySafeAreaInsets() {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const content = tgApp?.contentSafeAreaInset ?? {};
  const device = tgApp?.safeAreaInset ?? {};

  root.style.setProperty('--tg-content-safe-top', toSafePx(content.top));
  root.style.setProperty('--tg-content-safe-bottom', toSafePx(content.bottom));
  root.style.setProperty('--tg-content-safe-left', toSafePx(content.left));
  root.style.setProperty('--tg-content-safe-right', toSafePx(content.right));

  root.style.setProperty('--tg-device-safe-top', toSafePx(device.top));
  root.style.setProperty('--tg-device-safe-bottom', toSafePx(device.bottom));
  root.style.setProperty('--tg-device-safe-left', toSafePx(device.left));
  root.style.setProperty('--tg-device-safe-right', toSafePx(device.right));
}

function safeInit(fn, label) {
  try {
    fn();
  } catch (err) {
    console.warn(`[tg] ${label}:`, err);
  }
}

function parseInitDataUser() {
  const raw = tgApp?.initData;
  if (typeof raw !== 'string' || !raw) return null;

  try {
    const user = new URLSearchParams(raw).get('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

// Initialize
if (tgApp) {
  safeInit(() => tgApp.ready(), 'ready');
  safeInit(() => tgApp.expand(), 'expand');
  safeInit(applyFixedLightTheme, 'theme');
  safeInit(applySafeAreaInsets, 'safeArea');
  safeInit(() => tgApp.onEvent?.('themeChanged', applyFixedLightTheme), 'onTheme');
  safeInit(() => tgApp.onEvent?.('safeAreaChanged', applySafeAreaInsets), 'onSafeArea');
  safeInit(() => tgApp.onEvent?.('contentSafeAreaChanged', applySafeAreaInsets), 'onContentSafeArea');
  safeInit(() => tgApp.onEvent?.('viewportChanged', applySafeAreaInsets), 'onViewport');
}

const tg = {
  // Raw WebApp reference
  app: tgApp,

  // User data
  get user() {
    return tgApp?.initDataUnsafe?.user ?? parseInitDataUser();
  },

  get userName() {
    const u = this.user;
    if (!u) return 'GUEST';
    return (u.first_name || u.username || 'GUEST').toUpperCase();
  },

  // Color scheme
  get isDark() {
    return tgApp?.colorScheme === 'dark';
  },

  // Main Button
  MainButton: {
    setText(text) {
      tgApp?.MainButton?.setText(text);
    },
    show() {
      tgApp?.MainButton?.show();
    },
    hide() {
      tgApp?.MainButton?.hide();
    },
    enable() {
      tgApp?.MainButton?.enable();
    },
    disable() {
      tgApp?.MainButton?.disable();
    },
    showProgress() {
      tgApp?.MainButton?.showProgress();
    },
    hideProgress() {
      tgApp?.MainButton?.hideProgress();
    },
    onClick(fn) {
      tgApp?.MainButton?.onClick(fn);
    },
    offClick(fn) {
      tgApp?.MainButton?.offClick(fn);
    },
    setParams(params) {
      tgApp?.MainButton?.setParams(params);
    },
  },

  // Back Button
  BackButton: {
    show() {
      tgApp?.BackButton?.show();
    },
    hide() {
      tgApp?.BackButton?.hide();
    },
    onClick(fn) {
      tgApp?.BackButton?.onClick(fn);
    },
    offClick(fn) {
      tgApp?.BackButton?.offClick(fn);
    },
  },

  // Haptic feedback
  haptic: {
    impact(style = 'light') {
      tgApp?.HapticFeedback?.impactOccurred(style);
    },
    notification(type = 'success') {
      tgApp?.HapticFeedback?.notificationOccurred(type);
    },
    selection() {
      tgApp?.HapticFeedback?.selectionChanged();
    },
  },

  // Open Telegram / system share for current product or page URL
  shareLink(url, text = '') {
    const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    if (tgApp?.openTelegramLink) {
      tgApp.openTelegramLink(share);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ url, title: text }).catch(() => {
        window.open(share, '_blank', 'noopener,noreferrer');
      });
      return;
    }
    window.open(share, '_blank', 'noopener,noreferrer');
  },

  // Send order data to bot
  sendOrder(orderData) {
    if (tgApp) {
      tgApp.sendData(JSON.stringify(orderData));
    } else {
      console.log('[TG] sendData:', JSON.stringify(orderData, null, 2));
    }
  },

  // Close mini app
  close() {
    tgApp?.close();
  },

  // Telegram WebApp API доступен (в браузере тоже есть stub без initData)
  get isAvailable() {
    return !!tgApp;
  },

  /** Реальный запуск Mini App с пользователем Telegram */
  get isMiniApp() {
    const initData = tgApp?.initData;
    if (typeof initData === 'string' && initData.length > 0) return true;
    return Boolean(tgApp?.initDataUnsafe?.user?.id);
  },

  applyTheme() {
    applyFixedLightTheme();
  },

  applySafeArea() {
    applySafeAreaInsets();
  },

  /**
   * Запрос геолокации (Telegram LocationManager → браузер).
   * @returns {Promise<{ lat: number, lng: number }>}
   */
  requestLocation() {
    const app = tgApp;

    return new Promise((resolve, reject) => {
      if (app?.LocationManager) {
        try {
          app.LocationManager.init(() => {
            if (!app.LocationManager.isLocationAvailable) {
              this._browserLocation(resolve, reject);
              return;
            }
            app.LocationManager.getLocation((loc) => {
              if (loc?.latitude != null && loc?.longitude != null) {
                resolve({ lat: loc.latitude, lng: loc.longitude });
              } else {
                this._browserLocation(resolve, reject);
              }
            });
          });
          return;
        } catch {
          this._browserLocation(resolve, reject);
          return;
        }
      }
      this._browserLocation(resolve, reject);
    });
  },

  _browserLocation(resolve, reject) {
    if (!navigator?.geolocation) {
      reject(new Error('Геолокация недоступна'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  },
};

export default tg;
