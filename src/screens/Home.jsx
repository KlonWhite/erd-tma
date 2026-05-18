import { useNavigate } from 'react-router-dom';
import PhotoPlaceholder from '../components/PhotoPlaceholder.jsx';
import Header from '../components/Header.jsx';
import Rule from '../components/Rule.jsx';
import Caps from '../components/Caps.jsx';
import BottomNav from '../components/BottomNav.jsx';
import tg from '../tg.js';
import cowboysImg from '../Carnival Records Image Mar 18 2026.png@webp';

const NAV_LINKS = ['HOMME', 'FEMME', 'АРХИВ', 'МАГАЗИНЫ'];

export default function Home() {
  const navigate = useNavigate();

  const go = (path) => {
    tg.haptic.selection();
    navigate(path);
  };

  return (
    <>
      <div className="screen">
        <Header />

        {/* Split hero — viewport-tied height like editorial luxury mobile heroes */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', height: 'var(--erd-hero-split-height)' }}>
          <div
            style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
            onClick={() => go('/collection/cowboys')}
          >
            <img src={cowboysImg} alt="Ковбои Севера" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)',
            }} />
            <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
              <Caps size={11} weight={800} color="#fff">Ковбои Севера →</Caps>
            </div>
          </div>

          <div
            style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
            onClick={() => go('/collection/femme')}
          >
            <PhotoPlaceholder id={4} style={{ height: '100%', aspectRatio: 'unset', width: '100%' }} />
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)',
            }} />
            <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
              <Caps size={11} weight={800} color="#fff">FEMME →</Caps>
            </div>
          </div>
        </div>

        {/* Secondary nav */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '20px 16px',
          borderBottom: '1px solid var(--erd-rule)',
        }}>
          {NAV_LINKS.map(l => (
            <button
              key={l}
              onClick={() => go(l === 'МАГАЗИНЫ' ? '/stores' : l === 'АРХИВ' ? '/collection/archive' : `/collection/${l.toLowerCase()}`)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <Caps size={11} weight={800}>{l}</Caps>
            </button>
          ))}
        </div>

        {/* Lookbook callout */}
        <div
          style={{ padding: '24px var(--erd-gutter)', cursor: 'pointer' }}
          onClick={() => go('/lookbook/fw26')}
        >
          <Caps size={9} weight={700} color="var(--erd-ox)">ФИЛЬМ — ПОКАЗ F/W 26</Caps>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 900,
            fontSize: 22,
            lineHeight: 1,
            letterSpacing: '-0.01em',
            marginTop: 8,
            maxWidth: 'var(--erd-editorial-measure)',
            transform: 'scaleX(0.94)',
            transformOrigin: 'left',
          }}>
            «МЫ ОДЕВАЛИ ПРИЗРАКОВ<br />
            <span style={{ fontStyle: 'italic' }}>И НАЗЫВАЛИ ЭТО ПОШИВОМ.»</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <Caps size={9} weight={700} color="var(--erd-muted)">▷ СМОТРЕТЬ ЛУКБУК</Caps>
          </div>
        </div>

        <Rule />

        {/* Editorial link to lookbook 2 */}
        <div
          style={{ padding: '20px var(--erd-gutter)', display: 'flex', gap: 16, alignItems: 'center', cursor: 'pointer' }}
          onClick={() => go('/lookbook/ss26')}
        >
          <PhotoPlaceholder id={1} style={{ width: 80, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <Caps size={9} weight={700} color="var(--erd-ox)">ЛУКБУК — S/S 26</Caps>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 900,
              fontSize: 16,
              lineHeight: 1.05,
              letterSpacing: '-0.01em',
              marginTop: 6,
              maxWidth: 'var(--erd-editorial-measure)',
              transform: 'scaleX(0.94)',
              transformOrigin: 'left',
            }}>
              КОЛЛЕКЦИЯ<br />
              <span style={{ fontStyle: 'italic' }}>ВОСПОМИНАНИЙ.</span>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
