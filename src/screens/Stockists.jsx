import Header from '../components/Header.jsx';
import Caps from '../components/Caps.jsx';
import BottomNav from '../components/BottomNav.jsx';
import { STORES } from '../data/stores.js';
import tg from '../tg.js';

export default function Stockists() {
  return (
    <>
      <div className="screen">
        <Header />

        <div style={{ padding: '18px 18px' }}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 900,
            fontSize: 30,
            letterSpacing: '-0.01em',
            transform: 'scaleX(0.92)',
            transformOrigin: 'left',
          }}>
            МАГАЗИНЫ
          </div>
          <Caps size={9} weight={700} color="var(--erd-muted)" style={{ marginTop: 8, display: 'block' }}>
            {STORES.length} ТОЧЕК ПО ВСЕМУ МИРУ
          </Caps>
        </div>

        {/* Map */}
        <div style={{
          height: 160,
          margin: '0 18px',
          position: 'relative',
          background: '#0a0a0a',
          overflow: 'hidden',
        }}>
          <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <path
              d="M 0 90 Q 100 60 180 80 T 350 100"
              stroke="rgba(255,255,255,0.15)"
              fill="none"
              strokeWidth="0.5"
            />
          </svg>
          {STORES.map((store, i) => (
            <div
              key={store.id}
              style={{
                position: 'absolute',
                left: store.mapX,
                top: store.mapY,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: i === 0 ? 'var(--erd-ox)' : '#fff',
                boxShadow: i === 0 ? '0 0 0 4px rgba(122,13,13,0.3)' : 'none',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <Caps size={8} weight={700} color="rgba(255,255,255,0.5)">БЛИЖАЙШИЙ · ПАРИЖ</Caps>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          {STORES.map(store => (
            <div
              key={store.id}
              style={{
                padding: '14px 18px',
                borderTop: '1px solid var(--erd-rule)',
                cursor: 'pointer',
              }}
              onClick={() => tg.haptic.selection()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Caps size={14} weight={800}>{store.city}</Caps>
                <Caps size={9} weight={700} color={store.open ? 'var(--erd-ox)' : 'var(--erd-muted)'}>
                  {store.open ? '● ОТКРЫТО' : '○ ЗАКРЫТО'}
                </Caps>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginTop: 4,
              }}>
                <Caps size={9} weight={700} color="var(--erd-muted)">{store.address}</Caps>
              </div>
              <Caps size={9} weight={700} color="var(--erd-muted)" style={{ marginTop: 2, display: 'block' }}>
                {store.hours}
              </Caps>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
