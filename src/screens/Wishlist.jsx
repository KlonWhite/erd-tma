import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Rule from '../components/Rule.jsx';
import Caps from '../components/Caps.jsx';
import PhotoPlaceholder from '../components/PhotoPlaceholder.jsx';
import BottomNav from '../components/BottomNav.jsx';
import { PRODUCTS } from '../data/products.js';
import useStore from '../store/useStore.js';
import tg from '../tg.js';

export default function Wishlist() {
  const navigate = useNavigate();
  const wishlist = useStore(s => s.wishlist);
  const toggleWishlist = useStore(s => s.toggleWishlist);

  const items = wishlist
    .map(id => PRODUCTS.find(p => p.id === id))
    .filter(Boolean);

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
            ИЗБРАННОЕ{' '}
            <span style={{ color: 'var(--erd-muted)' }}>({items.length})</span>
          </div>
        </div>

        <Rule />

        {items.length === 0 ? (
          <div style={{
            padding: '60px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}>
            <Caps size={11} weight={700} color="var(--erd-muted)">СПИСОК ИЗБРАННОГО ПУСТ</Caps>
            <button
              onClick={() => navigate('/collection/homme')}
              style={{
                border: '1px solid var(--erd-ink)',
                background: 'transparent',
                padding: '12px 24px',
                cursor: 'pointer',
              }}
            >
              <Caps size={10} weight={800}>СМОТРЕТЬ КОЛЛЕКЦИЮ</Caps>
            </button>
          </div>
        ) : (
          items.map(product => (
            <div key={product.id} style={{
              display: 'flex',
              gap: 12,
              padding: '14px 18px',
              borderBottom: '1px solid var(--erd-rule)',
            }}>
              <div
                style={{ width: 72, flexShrink: 0, cursor: 'pointer' }}
                onClick={() => { tg.haptic.selection(); navigate(`/product/${product.id}`); }}
              >
                {product.images ? (
                  <img src={product.images[0]} alt={product.name} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <PhotoPlaceholder id={product.photoId} kind={product.photoKind} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <Caps size={11} weight={800} style={{ display: 'block', lineHeight: 1.3 }}>
                  {product.name}
                </Caps>
                <Caps size={9} weight={700} color="var(--erd-muted)" style={{ marginTop: 4, display: 'block' }}>
                  {product.edition}
                </Caps>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 12,
                }}>
                  <Caps size={11} weight={800}>{product.price.toLocaleString()} ₽</Caps>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => {
                        tg.haptic.impact();
                        toggleWishlist(product.id);
                      }}
                      style={{
                        border: '1px solid var(--erd-rule)',
                        padding: '5px 10px',
                        background: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Caps size={9} weight={700} color="var(--erd-muted)">♥</Caps>
                    </button>
                    <button
                      onClick={() => {
                        tg.haptic.selection();
                        navigate(`/product/${product.id}`);
                      }}
                      style={{
                        border: '1px solid var(--erd-ink)',
                        padding: '5px 12px',
                        background: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Caps size={9} weight={800}>ОТКРЫТЬ</Caps>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </>
  );
}
