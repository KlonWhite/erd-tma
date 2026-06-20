import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCollection } from '../data/collections.js';
import useAdminStore from '../admin/adminStore.js';
import Header from '../components/Header.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Caps from '../components/Caps.jsx';
import BottomNav from '../components/BottomNav.jsx';
import tg from '../tg.js';

const SORT_OPTIONS = [
  { id: 'default', label: 'ПО УМОЛЧАНИЮ' },
  { id: 'price-asc', label: 'ЦЕНА ↑' },
  { id: 'price-desc', label: 'ЦЕНА ↓' },
  { id: 'name-asc', label: 'A → Z' },
  { id: 'new-first', label: 'НОВЫЕ' },
];

const fieldStyle = {
  border: '1px solid var(--erd-rule)',
  background: 'var(--erd-paper)',
  color: 'var(--erd-ink)',
  padding: '8px 10px',
  fontFamily: 'var(--font-sans)',
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  minHeight: 34,
};

function getStock(product, size) {
  const stock = product.stockBySize ?? product.stock_by_size;
  if (stock && Object.prototype.hasOwnProperty.call(stock, size)) {
    return Number(stock[size]) || 0;
  }
  return product.soldSizes?.includes(size) ? 0 : 1;
}

function hasAnyStock(product) {
  const sizes = product.sizes?.length ? product.sizes : ['ONE SIZE'];
  return sizes.some(size => getStock(product, size) > 0);
}

function getPriceBounds(products) {
  const prices = products.map(p => Number(p.price) || 0).filter(n => n > 0);
  if (!prices.length) return { min: 0, max: 0 };
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

export default function Collection() {
  const { id } = useParams();
  const catalogVersion = useAdminStore(s => s.catalogProducts.length + Number(s.initialized));
  const collection = useMemo(() => getCollection(id ?? 'homme'), [id, catalogVersion]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [selectedSize, setSelectedSize] = useState('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState('default');

  useEffect(() => {
    setActiveFilter(null);
    setSelectedSize('all');
    setPriceMin('');
    setPriceMax('');
    setInStockOnly(false);
    setSort('default');
  }, [id]);

  const availableSizes = useMemo(() => {
    if (!collection) return [];
    return [...new Set(collection.products.flatMap(p => p.sizes ?? ['ONE SIZE']))]
      .filter(Boolean)
      .sort((a, b) => {
        const order = ['ONE SIZE', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
        const ai = order.indexOf(a);
        const bi = order.indexOf(b);
        if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        return String(a).localeCompare(String(b), 'ru');
      });
  }, [collection]);

  const priceBounds = useMemo(
    () => getPriceBounds(collection?.products ?? []),
    [collection],
  );

  const filtered = useMemo(() => {
    if (!collection) return [];
    const firstFilter = collection.filters[0];
    let list = collection.products;

    if (activeFilter && activeFilter !== firstFilter) {
      list = collection.id === 'archive'
        ? list.filter(p => p.archiveTag === activeFilter)
        : list.filter(p => p.category === activeFilter);
    }

    if (selectedSize !== 'all') {
      list = list.filter(p => (p.sizes ?? []).includes(selectedSize) && getStock(p, selectedSize) > 0);
    }

    if (inStockOnly) {
      list = list.filter(hasAnyStock);
    }

    const min = Number(priceMin);
    const max = Number(priceMax);
    if (Number.isFinite(min) && priceMin !== '') {
      list = list.filter(p => (Number(p.price) || 0) >= min);
    }
    if (Number.isFinite(max) && priceMax !== '') {
      list = list.filter(p => (Number(p.price) || 0) <= max);
    }

    const sorted = [...list];
    if (sort === 'price-asc') {
      sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sort === 'price-desc') {
      sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sort === 'name-asc') {
      sorted.sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''), 'ru'));
    } else if (sort === 'new-first') {
      sorted.sort((a, b) => String(b.id ?? '').localeCompare(String(a.id ?? ''), 'ru'));
    }

    return sorted;
  }, [collection, activeFilter, selectedSize, inStockOnly, priceMin, priceMax, sort]);

  const activeExtraFilters = [
    selectedSize !== 'all',
    inStockOnly,
    priceMin !== '',
    priceMax !== '',
    sort !== 'default',
  ].filter(Boolean).length;

  const resetFilters = () => {
    tg.haptic.selection();
    setActiveFilter(collection?.filters[0] ?? null);
    setSelectedSize('all');
    setPriceMin('');
    setPriceMax('');
    setInStockOnly(false);
    setSort('default');
  };

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
            {activeExtraFilters ? ` · +${activeExtraFilters}` : ''}
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

        {/* Advanced filters */}
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--erd-rule)',
          display: 'grid',
          gap: 8,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label>
              <Caps size={8} weight={800} color="var(--erd-muted)">РАЗМЕР</Caps>
              <select
                value={selectedSize}
                onChange={(e) => { tg.haptic.selection(); setSelectedSize(e.target.value); }}
                style={{ ...fieldStyle, width: '100%', marginTop: 4 }}
              >
                <option value="all">ВСЕ</option>
                {availableSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>

            <label>
              <Caps size={8} weight={800} color="var(--erd-muted)">СОРТИРОВКА</Caps>
              <select
                value={sort}
                onChange={(e) => { tg.haptic.selection(); setSort(e.target.value); }}
                style={{ ...fieldStyle, width: '100%', marginTop: 4 }}
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
            <label>
              <Caps size={8} weight={800} color="var(--erd-muted)">ЦЕНА ОТ</Caps>
              <input
                type="number"
                inputMode="numeric"
                value={priceMin}
                onChange={e => setPriceMin(e.target.value)}
                placeholder={priceBounds.min ? String(priceBounds.min) : '0'}
                style={{ ...fieldStyle, width: '100%', marginTop: 4 }}
              />
            </label>

            <label>
              <Caps size={8} weight={800} color="var(--erd-muted)">ЦЕНА ДО</Caps>
              <input
                type="number"
                inputMode="numeric"
                value={priceMax}
                onChange={e => setPriceMax(e.target.value)}
                placeholder={priceBounds.max ? String(priceBounds.max) : '∞'}
                style={{ ...fieldStyle, width: '100%', marginTop: 4 }}
              />
            </label>

            <button
              type="button"
              onClick={() => { tg.haptic.selection(); setInStockOnly(v => !v); }}
              style={{
                ...fieldStyle,
                borderColor: inStockOnly ? 'var(--erd-ink)' : 'var(--erd-rule)',
                background: inStockOnly ? 'var(--erd-ink)' : 'var(--erd-paper)',
                color: inStockOnly ? 'var(--erd-paper)' : 'var(--erd-ink)',
                whiteSpace: 'nowrap',
              }}
            >
              В НАЛИЧИИ
            </button>
          </div>

          {activeExtraFilters > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '4px 0 0',
                cursor: 'pointer',
                justifySelf: 'start',
              }}
            >
              <Caps size={8} weight={800} color="var(--erd-muted)">СБРОСИТЬ ФИЛЬТРЫ</Caps>
            </button>
          )}
        </div>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <div style={{ padding: '48px var(--erd-gutter)', textAlign: 'center' }}>
            <Caps size={11} weight={700} color="var(--erd-muted)">НЕТ ТОВАРОВ В ЭТОМ ФИЛЬТРЕ</Caps>
            <button
              type="button"
              onClick={resetFilters}
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
