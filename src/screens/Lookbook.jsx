import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLookbook } from '../data/lookbooks.js';
import PhotoPlaceholder from '../components/PhotoPlaceholder.jsx';
import Caps from '../components/Caps.jsx';
import Wordmark from '../components/Wordmark.jsx';
import tg from '../tg.js';

export default function Lookbook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const lookbook = getLookbook(id ?? 'fw26');
  const [lookIndex, setLookIndex] = useState(0);

  useEffect(() => {
    tg.BackButton.show();
    const back = () => navigate(-1);
    tg.BackButton.onClick(back);
    return () => {
      tg.BackButton.offClick(back);
      tg.BackButton.hide();
    };
  }, [navigate]);

  if (!lookbook) return null;

  const look = lookbook.looks[lookIndex];

  return (
    <div style={{
      height: '100%',
      background: 'var(--erd-ink)',
      color: 'var(--erd-paper)',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 'var(--safe-top)',
      overflowY: 'auto',
      paddingBottom: 'var(--safe-bottom)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        flexShrink: 0,
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Caps size={9} weight={700} color="#fff">← НАЗАД</Caps>
        </button>
        <Wordmark size={11} color="#fff" />
        <Caps size={9} weight={700} color="#fff">{lookbook.season}</Caps>
      </div>

      {/* Image */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <PhotoPlaceholder id={look.photoId} style={{ aspectRatio: '4/5', width: '100%' }} />
        <div style={{ position: 'absolute', top: 16, left: 16 }}>
          <Caps size={9} weight={700} color="rgba(255,255,255,0.85)">
            ОБРАЗ {look.number} / {lookbook.totalLooks} · {lookbook.season}
          </Caps>
        </div>
        <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 900,
            fontSize: 28,
            lineHeight: 1,
            letterSpacing: '-0.01em',
            color: '#fff',
            transform: 'scaleX(0.94)',
            transformOrigin: 'left',
            whiteSpace: 'pre-line',
          }}>
            {lookbook.title.split('\n').map((line, i) => (
              <div key={i} style={{ fontStyle: i === 1 ? 'italic' : 'normal' }}>{line}</div>
            ))}
          </div>
        </div>

        {/* Look navigation */}
        {lookbook.looks.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 20, right: 20,
            display: 'flex', gap: 8,
          }}>
            {lookbook.looks.map((_, i) => (
              <button
                key={i}
                onClick={() => { tg.haptic.selection(); setLookIndex(i); }}
                style={{
                  width: i === lookIndex ? 18 : 6,
                  height: 3,
                  background: i === lookIndex ? '#fff' : 'rgba(255,255,255,0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Credits */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingBottom: 16,
          borderBottom: '1px solid rgba(255,255,255,0.15)',
        }}>
          <div>
            <Caps size={9} weight={700} color="rgba(255,255,255,0.5)">ФОТОГРАФ</Caps>
            <div style={{ marginTop: 4 }}>
              <Caps size={11} weight={700} color="#fff">{lookbook.photographer}</Caps>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Caps size={9} weight={700} color="rgba(255,255,255,0.5)">ЛОКАЦИЯ</Caps>
            <div style={{ marginTop: 4 }}>
              <Caps size={11} weight={700} color="#fff">{lookbook.location}</Caps>
            </div>
          </div>
        </div>

        {/* Shop the Look */}
        <Caps size={9} weight={700} color="rgba(255,255,255,0.5)" style={{ display: 'block', marginTop: 18 }}>
          СОБРАТЬ ОБРАЗ
        </Caps>
        <div style={{ marginTop: 10 }}>
          {look.items.map(item => (
            <button
              key={item.productId}
              onClick={() => {
                tg.haptic.selection();
                navigate(`/product/${item.productId}`);
              }}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                alignItems: 'center',
              }}
            >
              <Caps size={10} weight={700} color="#fff">{item.name}</Caps>
              <Caps size={10} weight={700} color="rgba(255,255,255,0.7)">
                {item.price.toLocaleString()} ₽  →
              </Caps>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
