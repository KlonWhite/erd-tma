import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhotoPlaceholder from '../components/PhotoPlaceholder.jsx';
import Caps from '../components/Caps.jsx';
import Rule from '../components/Rule.jsx';
import BottomNav from '../components/BottomNav.jsx';
import { getCatalogProducts } from '../lib/catalog.js';
import tg from '../tg.js';

const RECENT = ['ХУДИ', 'ФУТБОЛКА', 'ЛОНГСЛИВ', 'ТРЕНЧ', 'ДЖИНСЫ'];
const SUGGESTIONS = [
  ['ХУДИ КОВБОИ СЕВЕРА', 'ТОЛСТОВКИ И ХУДИ', 'c003'],
  ['ДВУБОРТНЫЙ ТРЕНЧ-ПЛАЩ', 'ВЕРХНЯЯ ОДЕЖДА', 'c010'],
  ['ДЖИНСЫ НОМЕР ОДИН', 'БРЮКИ', 'c012'],
];

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const results = query.length >= 2
    ? getCatalogProducts().filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <>
      <div className="screen">
        {/* Search bar */}
        <div style={{
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 'calc(14px + var(--safe-top))',
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Caps size={10} weight={700}>← ОТМЕНА</Caps>
          </button>
          <Caps size={10} weight={800}>ПОИСК</Caps>
          <div style={{ width: 60 }} />
        </div>

        <div style={{
          margin: '6px 18px 20px',
          borderBottom: '1px solid var(--erd-ink)',
          paddingBottom: 12,
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
        }}>
          <Caps size={14} weight={800}>⌕</Caps>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ПОИСК..."
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 900,
              fontSize: 20,
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--erd-ink)',
            }}
          />
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div style={{ padding: '0 18px' }}>
            <Caps size={9} weight={700} color="var(--erd-muted)">РЕЗУЛЬТАТЫ</Caps>
            <div style={{ marginTop: 10 }}>
              {results.map(p => (
                <button
                  key={p.id}
                  onClick={() => { tg.haptic.selection(); navigate(`/product/${p.id}`); }}
                  style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between',
                    padding: '12px 0', borderBottom: '1px solid var(--erd-rule)',
                    textAlign: 'left',
                  }}
                >
                  <Caps size={11} weight={700}>{p.name}</Caps>
                  <Caps size={9} weight={700} color="var(--erd-muted)">
                    {p.price.toLocaleString()} ₽  →
                  </Caps>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: '0 18px' }}>
            {/* Suggestions */}
            <Caps size={9} weight={700} color="var(--erd-muted)">РЕКОМЕНДАЦИИ</Caps>
            <div style={{ marginTop: 10 }}>
              {SUGGESTIONS.map(([n, c, pid]) => (
                <button
                  key={n}
                  onClick={() => {
                    tg.haptic.selection();
                    if (pid) navigate(`/product/${pid}`);
                  }}
                  style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between',
                    padding: '12px 0', borderBottom: '1px solid var(--erd-rule)',
                    textAlign: 'left',
                  }}
                >
                  <Caps size={11} weight={700}>{n}</Caps>
                  <Caps size={9} weight={700} color="var(--erd-muted)">{c}  →</Caps>
                </button>
              ))}
            </div>

            {/* Recent */}
            <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 22 }}>
              НЕДАВНЕЕ
            </Caps>
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {RECENT.map(t => (
                <button
                  key={t}
                  onClick={() => setQuery(t)}
                  style={{ padding: '5px 10px', border: '1px solid var(--erd-rule)', background: 'none', cursor: 'pointer' }}
                >
                  <Caps size={9} weight={700}>{t}  ✕</Caps>
                </button>
              ))}
            </div>

            {/* Popular */}
            <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 22 }}>
              ПОПУЛЯРНОЕ
            </Caps>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              {[1, 4].map((id, i) => (
                <div key={i} style={{ position: 'relative', cursor: 'pointer' }}
                  onClick={() => { tg.haptic.selection(); navigate('/collection/homme'); }}
                >
                  <PhotoPlaceholder id={id} />
                  <div style={{ position: 'absolute', bottom: 6, left: 6 }}>
                    <Caps size={8} weight={700} color="#fff">{i === 0 ? 'F/W 26' : 'S/S 26'}</Caps>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}
