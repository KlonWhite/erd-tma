import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCollection } from '../data/collections.js';
import useAdminStore from '../admin/adminStore.js';
import Header from '../components/Header.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Caps from '../components/Caps.jsx';
import BottomNav from '../components/BottomNav.jsx';
import tg from '../tg.js';

export default function Collection() {
  const { id } = useParams();
  const catalogVersion = useAdminStore(s => s.catalogProducts.length + Number(s.initialized));
  const collection = useMemo(() => getCollection(id ?? 'homme'), [id, catalogVersion]);
  const [activeFilter, setActiveFilter] = useState(null);

  useEffect(() => {
    setActiveFilter(null);
  }, [id]);

  const filtered = useMemo(() => {
    if (!collection) return [];
    const firstFilter = collection.filters[0];
    if (!activeFilter || activeFilter === firstFilter) return collection.products;
    if (collection.id === 'archive') {
      return collection.products.filter(p => p.archiveTag === activeFilter);
    }
    return collection.products.filter(p => p.category === activeFilter);
  }, [collection, activeFilter]);

  if (!collection) return null;

  return (
    <>
      <div className="screen">
        <Header />

        {/* Title bar */}
        <div style={{
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--erd-rule)',
        }}>
          <Caps size={11} weight={800}>{collection.headline}</Caps>
          <Caps size={10} weight={700} color="var(--erd-muted)">
            ФИЛЬТР · {filtered.length}
          </Caps>
        </div>

        {/* Filter chips */}
        <div style={{
          display: 'flex',
          gap: 6,
          padding: '10px 18px',
          overflowX: 'auto',
          borderBottom: '1px solid var(--erd-rule)',
          scrollbarWidth: 'none',
        }}>
          {collection.filters.map(f => (
            <button
              key={f}
              onClick={() => {
                tg.haptic.selection();
                setActiveFilter(f);
              }}
              style={{
                padding: '6px 10px',
                border: `1px solid ${(f === activeFilter || (!activeFilter && f === collection.filters[0])) ? 'var(--erd-ink)' : 'var(--erd-rule)'}`,
                background: (f === activeFilter || (!activeFilter && f === collection.filters[0])) ? 'var(--erd-ink)' : 'transparent',
                color: (f === activeFilter || (!activeFilter && f === collection.filters[0])) ? 'var(--erd-paper)' : 'var(--erd-ink)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Caps size={9} weight={700}>{f}</Caps>
            </button>
          ))}
        </div>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <div style={{ padding: '48px var(--erd-gutter)', textAlign: 'center' }}>
            <Caps size={11} weight={700} color="var(--erd-muted)">НЕТ ТОВАРОВ В ЭТОМ ФИЛЬТРЕ</Caps>
            <button
              type="button"
              onClick={() => { tg.haptic.selection(); setActiveFilter(collection.filters[0]); }}
              style={{
                display: 'block',
                margin: '18px auto 0',
                border: '1px solid var(--erd-ink)',
                background: 'transparent',
                padding: '10px 20px',
                cursor: 'pointer',
              }}
            >
              <Caps size={10} weight={800}>ПОКАЗАТЬ ВСЕ</Caps>
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}
