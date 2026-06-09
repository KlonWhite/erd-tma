import PhotoPlaceholder from './PhotoPlaceholder.jsx';
import { getProductImage } from '../data/productImages.js';
import { getProduct } from '../lib/catalog.js';

/** Превью товара: актуальное фото из каталога или placeholder */
export default function ProductThumb({ product, productId, style }) {
  const fresh = productId ? getProduct(productId) : product;
  const src = getProductImage(fresh ?? product);

  if (src) {
    return (
      <img
        src={src}
        alt={fresh?.name ?? product?.name ?? ''}
        style={{
          width: '100%',
          aspectRatio: '3/4',
          objectFit: 'cover',
          display: 'block',
          background: '#fff',
          ...style,
        }}
      />
    );
  }

  const p = fresh ?? product;
  return (
    <PhotoPlaceholder
      id={p?.photoId ?? 0}
      kind={p?.photoKind ?? 'product'}
      style={style}
    />
  );
}
