import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../data/products.js';
import PhotoPlaceholder from '../components/PhotoPlaceholder.jsx';
import Caps from '../components/Caps.jsx';
import Rule from '../components/Rule.jsx';
import useStore from '../store/useStore.js';
import tg from '../tg.js';

export default function PDP() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = getProduct(id ?? '');
  const addToCart = useStore(s => s.addToCart);
  const clearCart = useStore(s => s.clearCart);
  const toggleWishlist = useStore(s => s.toggleWishlist);
  const isWishlisted = useStore(s => s.isWishlisted);

  const [selectedSize, setSelectedSize] = useState(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const wishlisted = product ? isWishlisted(product.id) : false;

  useEffect(() => {
    tg.BackButton.show();
    const back = () => navigate(-1);
    tg.BackButton.onClick(back);
    return () => {
      tg.BackButton.offClick(back);
      tg.BackButton.hide();
    };
  }, [navigate]);

  if (!product) return (
    <div style={{ padding: 24 }}>
      <Caps size={11} weight={700} color="var(--erd-muted)">ТОВАР НЕ НАЙДЕН</Caps>
    </div>
  );

  const openSizeSheet = () => {
    tg.haptic.selection();
    setSheetOpen(true);
  };

  const pickSize = (s) => {
    if (product.soldSizes.includes(s)) return;
    tg.haptic.selection();
    setSelectedSize(s);
    setSheetOpen(false);
  };

  const handleAdd = () => {
    if (!selectedSize) {
      openSizeSheet();
      return;
    }
    if (product.soldSizes.includes(selectedSize)) {
      tg.haptic.notification('error');
      return;
    }
    addToCart(product, selectedSize);
    tg.haptic.notification('success');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      openSizeSheet();
      return;
    }
    if (product.soldSizes.includes(selectedSize)) {
      tg.haptic.notification('error');
      return;
    }
    clearCart();
    addToCart(product, selectedSize);
    tg.haptic.notification('success');
    navigate('/checkout');
  };

  const shareProduct = () => {
    tg.haptic.selection();
    const base = window.location.href.replace(/#.*$/, '');
    const url = `${base}#/product/${product.id}`;
    tg.shareLink(url, product.name);
  };

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      paddingTop: 'var(--safe-top)',
      background: 'var(--erd-paper)',
    }}>
      <div style={{
        padding: '12px var(--erd-gutter)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--erd-rule)',
        flexShrink: 0,
      }}>
        <button type="button" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Caps size={10} weight={700}>← НАЗАД</Caps>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={shareProduct}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            aria-label="Share product"
          >
            <Caps size={10} weight={700}>ПОДЕЛИТЬСЯ ↗</Caps>
          </button>
          <button
            type="button"
            onClick={() => { tg.haptic.impact(); toggleWishlist(product.id); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 18 }}
            aria-label={wishlisted ? 'Remove from saved' : 'Save item'}
          >
            {wishlisted ? '♥' : '♡'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: sheetOpen ? 0 : 168 }}>
        <div style={{ position: 'relative', background: '#fff' }}>
          {product.images ? (
            <img
              src={product.images[imgIndex]}
              alt={product.name}
              style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <PhotoPlaceholder id={product.photoId} kind={product.photoKind} />
          )}
          <div style={{
            position: 'absolute', bottom: 10, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 6,
          }}>
            {(product.images || [0, 1, 2, 3, 4]).map((_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setImgIndex(i)}
                style={{
                  width: i === imgIndex ? 18 : 6,
                  height: 3,
                  background: i === imgIndex ? 'var(--erd-ink)' : 'rgba(0,0,0,0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>

        <Rule />

        <div style={{ padding: '20px var(--erd-gutter) 14px', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 900,
            fontSize: 20,
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
          }}>
            {product.name}
          </div>
          <div style={{ marginTop: 6 }}>
            <Caps size={10} weight={700} color="var(--erd-muted)">{product.subtitle}</Caps>
          </div>
          <div style={{ marginTop: 6 }}>
            <Caps size={10} weight={700} color="var(--erd-ox)">{product.edition}</Caps>
          </div>
          <div style={{ marginTop: 14 }}>
            <Caps size={13} weight={800}>{product.price.toLocaleString()} ₽</Caps>
          </div>
          <div style={{ marginTop: 14, padding: '0 8px' }}>
            <Caps size={8} weight={700} color="var(--erd-muted)" style={{ lineHeight: 1.65 }}>
              БЕСПЛАТНАЯ ДОСТАВКА · ВОЗВРАТ В ТЕЧЕНИЕ 14 ДНЕЙ
            </Caps>
          </div>
        </div>

        <div style={{ padding: '0 var(--erd-gutter) 18px' }}>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 10,
            lineHeight: 1.7,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.7)',
            textAlign: 'center',
          }}>
            {product.description}
          </p>
        </div>

        {product.specs && (
          <div style={{ padding: '0 var(--erd-gutter) 18px' }}>
            {product.specs.map((spec, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid var(--erd-rule)',
              }}>
                <Caps size={9} weight={700} color="var(--erd-muted)">{spec.label}</Caps>
                <Caps size={9} weight={700}>{spec.value}</Caps>
              </div>
            ))}
          </div>
        )}

        <Rule />

        <div style={{ padding: '16px var(--erd-gutter) 24px' }}>
          <button
            type="button"
            onClick={openSizeSheet}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'none',
              border: '1px solid var(--erd-rule)',
              padding: '14px 16px',
              cursor: 'pointer',
            }}
          >
            <Caps size={10} weight={800}>РАЗМЕР</Caps>
            <Caps size={10} weight={700} color={selectedSize ? 'var(--erd-ink)' : 'var(--erd-ox)'}>
              {selectedSize || 'ВЫБРАТЬ'}
            </Caps>
          </button>
        </div>
      </div>

      {!sheetOpen && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '12px var(--erd-gutter)',
          paddingBottom: 'calc(12px + var(--safe-bottom))',
          background: 'var(--erd-paper)',
          borderTop: '1px solid var(--erd-rule)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {!selectedSize ? (
            <button
              type="button"
              onClick={handleBuyNow}
              style={{
                width: '100%',
                background: 'var(--erd-ink)',
                color: 'var(--erd-paper)',
                border: 'none',
                padding: '16px 0',
                cursor: 'pointer',
              }}
            >
              <Caps size={11} weight={700} style={{ letterSpacing: '0.08em' }}>ВЫБРАТЬ РАЗМЕР</Caps>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleBuyNow}
                style={{
                  width: '100%',
                  background: 'var(--erd-ink)',
                  color: 'var(--erd-paper)',
                  border: 'none',
                  padding: '16px 0',
                  cursor: 'pointer',
                }}
              >
                <Caps size={11} weight={700} style={{ letterSpacing: '0.08em' }}>
                  КУПИТЬ — {product.price.toLocaleString()} ₽
                </Caps>
              </button>
              <button
                type="button"
                onClick={handleAdd}
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: 'var(--erd-ink)',
                  border: '1px solid var(--erd-ink)',
                  padding: '14px 0',
                  cursor: 'pointer',
                }}
              >
                <Caps size={11} weight={700} style={{ letterSpacing: '0.06em' }}>
                  {added
                    ? '✓ ДОБАВЛЕНО'
                    : `В КОРЗИНУ — ${product.price.toLocaleString()} ₽`}
                </Caps>
              </button>
            </>
          )}
        </div>
      )}

      {sheetOpen && (
        <>
          <button
            type="button"
            aria-label="Close size picker"
            onClick={() => setSheetOpen(false)}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 200,
              border: 'none',
              padding: 0,
              margin: 0,
              background: 'rgba(0,0,0,0.45)',
              cursor: 'pointer',
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdp-size-sheet-title"
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 201,
              background: 'var(--erd-paper)',
              borderTopLeftRadius: 14,
              borderTopRightRadius: 14,
              paddingBottom: 'calc(20px + var(--safe-bottom))',
              maxHeight: 'min(62vh, 520px)',
              overflowY: 'auto',
              boxShadow: '0 -12px 48px rgba(0,0,0,0.14)',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px var(--erd-gutter)',
              borderBottom: '1px solid var(--erd-rule)',
            }}>
              <div id="pdp-size-sheet-title">
                <Caps size={11} weight={800}>ВЫБРАТЬ РАЗМЕР</Caps>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, fontSize: 18, lineHeight: 1 }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '16px var(--erd-gutter) 8px' }}>
              <Caps size={9} weight={700} color="var(--erd-muted)">
                {product.name} — {product.price.toLocaleString()} ₽
              </Caps>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px var(--erd-gutter) 20px' }}>
              {product.sizes.map(s => {
                const sold = product.soldSizes.includes(s);
                const active = selectedSize === s;
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => pickSize(s)}
                    disabled={sold}
                    style={{
                      flex: '1 1 auto',
                      minWidth: 56,
                      padding: '14px 0',
                      textAlign: 'center',
                      border: `1px solid ${active ? 'var(--erd-ink)' : 'var(--erd-rule)'}`,
                      background: active ? 'var(--erd-ink)' : 'transparent',
                      color: active ? 'var(--erd-paper)' : 'var(--erd-ink)',
                      opacity: sold ? 0.35 : 1,
                      cursor: sold ? 'not-allowed' : 'pointer',
                      textDecoration: sold ? 'line-through' : 'none',
                    }}
                  >
                    <Caps size={11} weight={800}>{s}</Caps>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
