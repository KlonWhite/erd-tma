import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Caps from '../../components/Caps.jsx';
import ListToolbar from '../components/ListToolbar.jsx';
import useAdminStore from '../adminStore.js';
import { cmpNum, cmpStr, matchSearch, sortItems } from '../listUtils.js';

const card = { background: '#fff', border: '1px solid var(--erd-rule)', padding: '12px 14px' };

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Название A→Z' },
  { value: 'name-desc', label: 'Название Z→A' },
  { value: 'price-desc', label: 'Цена ↓' },
  { value: 'price-asc', label: 'Цена ↑' },
];

const PRODUCT_SORT = {
  'name-asc': (a, b) => cmpStr(a.name, b.name),
  'name-desc': (a, b) => cmpStr(b.name, a.name),
  'price-desc': (a, b) => cmpNum(b.price, a.price),
  'price-asc': (a, b) => cmpNum(a.price, b.price),
};

export default function ProductsPage() {
  const products = useAdminStore(s => s.catalogProducts);
  const categories = useAdminStore(s => s.categories);
  const deleteProduct = useAdminStore(s => s.deleteProduct);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sort, setSort] = useState('name-asc');

  const catName = (id) => categories.find(c => c.id === id)?.name ?? '—';

  const categoryFilters = useMemo(() => [
    { id: 'all', label: 'ВСЕ' },
    ...categories.map(c => ({ id: c.id, label: c.name.slice(0, 12) })),
  ], [categories]);

  const filtered = useMemo(() => {
    let list = categoryFilter === 'all'
      ? products
      : products.filter(p => p.categoryId === categoryFilter);
    list = list.filter(p => matchSearch(query, [p.name, p.id, catName(p.categoryId)]));
    return sortItems(list, sort, PRODUCT_SORT);
  }, [products, categoryFilter, query, sort, categories]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Caps size={12} weight={800}>ТОВАРЫ</Caps>
        <Link to="/admin/products/new" style={{ border: '1px solid var(--erd-ink)', padding: '6px 12px', textDecoration: 'none', color: 'inherit' }}>
          <Caps size={9} weight={800}>+ ДОБАВИТЬ</Caps>
        </Link>
      </div>

      <ListToolbar
        query={query}
        onQueryChange={setQuery}
        queryPlaceholder="ПОИСК: НАЗВАНИЕ, ID"
        sort={sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        filters={categoryFilters}
        activeFilter={categoryFilter}
        onFilterChange={setCategoryFilter}
        count={filtered.length}
        total={products.length}
      />

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(p => (
          <div key={p.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <Caps size={11} weight={800}>{p.name}</Caps>
                <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 4 }}>
                  {catName(p.categoryId)} · {p.price?.toLocaleString()} ₽
                </Caps>
                <Caps size={8} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 4 }}>
                  {p.sizes?.join(', ')}
                </Caps>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Link to={`/admin/products/${p.id}`} style={{ textDecoration: 'none' }}>
                  <Caps size={9} weight={700}>ИЗМ.</Caps>
                </Link>
                <button type="button" onClick={() => { if (confirm('Удалить товар?')) deleteProduct(p.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <Caps size={9} weight={700} color="var(--erd-ox)">УДАЛ.</Caps>
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <Caps size={10} weight={700} color="var(--erd-muted)">НЕТ ТОВАРОВ</Caps>
        )}
      </div>
    </div>
  );
}
