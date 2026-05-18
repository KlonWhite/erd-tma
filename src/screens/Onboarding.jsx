import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhotoPlaceholder from '../components/PhotoPlaceholder.jsx';
import Caps from '../components/Caps.jsx';
import useStore from '../store/useStore.js';
import tg from '../tg.js';

const SLIDES = [
  {
    photoId: 2,
    headline: 'ЭТО АРХИВ,',
    headlineItalic: 'А НЕ МАГАЗИН.',
    body: 'Каждая вещь задокументирована, датирована и выпущена ограниченным тиражом. Листайте сезоны как личную библиотеку.',
  },
  {
    photoId: 0,
    headline: 'ОДЕТЫЕ',
    headlineItalic: 'ВО ТЬМУ.',
    body: 'Enfants Riches Déprimés. С 2012 года. Лос-Анджелес / Париж. Мода как протест, одежда как манифест.',
  },
  {
    photoId: 4,
    headline: 'ДОБРО ПОЖАЛОВАТЬ',
    headlineItalic: 'В АРХИВ.',
    body: 'Участники закрытого клуба получают ранний доступ к новым дропам, лукбукам и архивным изданиям.',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const setOnboardingDone = useStore(s => s.setOnboardingDone);
  const [slide, setSlide] = useState(0);

  const finish = () => {
    setOnboardingDone();
    navigate('/home', { replace: true });
  };

  const next = () => {
    tg.haptic.selection();
    if (slide < SLIDES.length - 1) {
      setSlide(s => s + 1);
    } else {
      finish();
    }
  };

  const skip = () => {
    tg.haptic.impact('light');
    finish();
  };

  const s = SLIDES[slide];

  return (
    <div className="screen screen--dark screen--no-nav" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      paddingTop: 'var(--safe-top)',
    }}>
      {/* Photo */}
      <div style={{ position: 'relative', flex: '0 0 55%', overflow: 'hidden' }}>
        <PhotoPlaceholder id={s.photoId} style={{ height: '100%', aspectRatio: 'unset', width: '100%' }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)',
        }} />
        <div style={{
          position: 'absolute', top: 20, left: 20, right: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Caps size={9} weight={700} color="rgba(255,255,255,0.7)">
            0{slide + 1} / 0{SLIDES.length}
          </Caps>
          <button onClick={skip} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Caps size={9} weight={700} color="rgba(255,255,255,0.7)">ПРОПУСТИТЬ →</Caps>
          </button>
        </div>
      </div>

      {/* Text */}
      <div style={{ padding: '28px 28px 16px', color: 'var(--erd-paper)', flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 900,
          fontSize: 36,
          lineHeight: 0.92,
          letterSpacing: '-0.01em',
          transform: 'scaleX(0.92)',
          transformOrigin: 'left',
        }}>
          {s.headline}<br />
          <span style={{ fontStyle: 'italic' }}>{s.headlineItalic}</span>
        </div>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          lineHeight: 1.6,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginTop: 18,
          color: 'rgba(255,255,255,0.65)',
          maxWidth: 280,
        }}>
          {s.body}
        </p>
      </div>

      {/* Controls */}
      <div style={{
        padding: '16px 28px',
        paddingBottom: 'calc(28px + var(--safe-bottom))',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {/* Progress bars */}
        <div style={{ display: 'flex', gap: 6 }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              style={{
                flex: i === slide ? 2 : 1,
                height: 2,
                background: i <= slide ? 'var(--erd-paper)' : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          style={{
            border: '1px solid var(--erd-paper)',
            background: 'transparent',
            padding: '13px 0',
            textAlign: 'center',
            color: 'var(--erd-paper)',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          <Caps size={10} weight={700}>
            {slide < SLIDES.length - 1 ? 'ДАЛЕЕ' : 'ВОЙТИ В АРХИВ'}
          </Caps>
        </button>
      </div>
    </div>
  );
}
