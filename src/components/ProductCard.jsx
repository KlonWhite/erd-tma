import { useNavigate } from 'react-router-dom';
import PhotoPlaceholder from './PhotoPlaceholder.jsx';
import Caps from './Caps.jsx';
import useStore from '../store/useStore.js';
import { getProductImage } from '../data/productImages.js';
import tg from '../tg.js';

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const toggleWishlist = useStore(s => s.toggleWishlist);
  const wishlisted = useStore(s => s.isWishlisted(product.id));

  const go = () => {
    tg.haptic.selection();
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      onClick={go}
      style={{
        padding: 'var(--erd-grid-gap) var(--erd-grid-gap) 14px',
        borderRight: index % 2 === 0 ? '1px solid var(--erd-rule)' : 'none',
        borderBottom: '1px solid var(--erd-rule)',
        cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          aria-label={wishlisted ? 'Remove from saved' : 'Save item'}
          onClick={(e) => {
            e.stopPropagation();
            tg.haptic.selection();
            toggleWishlist(product.id);
          }}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.94)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            lineHeight: 1,
            color: wishlisted ? 'var(--erd-ox)' : 'var(--erd-ink)',
          }}
        >
          {wishlisted ? '♥' : '♡'}
        </button>
        {getProductImage(product) ? (
          <img src={getProductImage(product)} alt={product.name} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
        ) : (
          <PhotoPlaceholder id={product.photoId} kind={product.photoKind} />
        )}
      </div>
      <div style={{ marginTop: 8, padding: '0 4px' }}>
        <Caps size={10} weight={800} style={{ display: 'block', lineHeight: 1.25 }}>
          {product.name}
        </Caps>
        <div style={{ marginTop: 4 }}>
          <Caps size={9} weight={700} color="var(--erd-muted)">
            {product.price.toLocaleString()} ₽
          </Caps>
        </div>
      </div>
    </div>
  );
}
