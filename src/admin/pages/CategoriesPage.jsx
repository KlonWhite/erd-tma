import { useMemo, useState } from 'react';
import Caps from '../../components/Caps.jsx';
import ListToolbar from '../components/ListToolbar.jsx';
import useAdminStore from '../adminStore.js';
import { cmpStr, matchSearch, sortItems } from '../listUtils.js';

const card = { background: '#fff', border: '1px solid var(--erd-rule)', padding: '12px 14px' };

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Название A→Z' },
  { value: 'name-desc', label: 'Название Z→A' },
  { value: 'slug-asc', label: 'Slug A→Z' },
];

const CATEGORY_SORT = {
  'name-asc': (a, b) => cmpStr(a.name, b.name),
  'name-desc': (a, b) => cmpStr(b.name, a.name),
  'slug-asc': (a, b) => cmpStr(a.slug, b.slug),
};

export default function CategoriesPage() {
  const categories = useAdminStore(s => s.categories);
  const addCategory = useAdminStore(s => s.addCategory);
  const updateCategory = useAdminStore(s => s.updateCategory);
  const deleteCategory = useAdminStore(s => s.deleteCategory);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('name-asc');

  const filtered = useMemo(() => {
    const list = categories.filter(c => matchSearch(query, [c.name, c.slug, c.id]));
    return sortItems(list, sort, CATEGORY_SORT);
  }, [categories, query, sort]);

  const create = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCategory({ name: name.trim(), slug: slug.trim() || name.trim().toLowerCase() });
    setName('');
    setSlug('');
  };

  return (
    <div>
      <Caps size={12} weight={800}>КАТЕГОРИИ</Caps>

      <form onSubmit={create} style={{ ...card, marginTop: 14 }}>
        <Caps size={9} weight={700} color="var(--erd-muted)">НОВАЯ КАТЕГОРИЯ</Caps>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="НАЗВАНИЕ" style={{ width: '100%', marginTop: 8, padding: '8px 0', border: 'none', borderBottom: '1px solid var(--erd-rule)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }} />
        <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="SLUG (опционально)" style={{ width: '100%', marginTop: 8, padding: '8px 0', border: 'none', borderBottom: '1px solid var(--erd-rule)', fontWeight: 700, fontSize: 12 }} />
        <button type="submit" style={{ marginTop: 12, border: '1px solid var(--erd-ink)', background: 'var(--erd-ink)', color: '#fff', padding: '8px 14px', cursor: 'pointer' }}>
          <Caps size={9} weight={800}>СОЗДАТЬ</Caps>
        </button>
      </form>

      <ListToolbar
        query={query}
        onQueryChange={setQuery}
        queryPlaceholder="ПОИСК: НАЗВАНИЕ, SLUG"
        sort={sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        count={filtered.length}
        total={categories.length}
      />

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(c => (
          <div key={c.id} style={card}>
            {editId === c.id ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '100%', padding: '6px 0', border: 'none', borderBottom: '1px solid var(--erd-ink)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button type="button" onClick={() => { updateCategory(c.id, { name: editName }); setEditId(null); }} style={{ border: '1px solid var(--erd-ink)', background: 'var(--erd-ink)', color: '#fff', padding: '4px 10px', cursor: 'pointer' }}>
                    <Caps size={8} weight={700}>OK</Caps>
                  </button>
                  <button type="button" onClick={() => setEditId(null)} style={{ border: '1px solid var(--erd-rule)', background: 'transparent', padding: '4px 10px', cursor: 'pointer' }}>
                    <Caps size={8} weight={700}>ОТМЕНА</Caps>
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Caps size={11} weight={800}>{c.name}</Caps>
                  <Caps size={8} weight={700} color="var(--erd-muted)">{c.slug}</Caps>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => { setEditId(c.id); setEditName(c.name); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Caps size={9} weight={700}>ИЗМ.</Caps>
                  </button>
                  <button type="button" onClick={() => { if (confirm('Удалить категорию?')) deleteCategory(c.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Caps size={9} weight={700} color="var(--erd-ox)">УДАЛ.</Caps>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <Caps size={10} weight={700} color="var(--erd-muted)">НЕТ КАТЕГОРИЙ</Caps>
        )}
      </div>
    </div>
  );
}
