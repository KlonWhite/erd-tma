import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Caps from '../../components/Caps.jsx';
import CTA from '../../components/CTA.jsx';
import useAdminStore from '../adminStore.js';
import { uploadProductImages } from '../../lib/storage.js';
import { isSupabaseConfigured } from '../../lib/supabase.js';

const fieldStyle = {
  width: '100%',
  padding: '10px 0',
  border: 'none',
  borderBottom: '1px solid var(--erd-rule)',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  outline: 'none',
  background: 'transparent',
};

export default function ProductFormPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isNew = productId === 'new';
  const products = useAdminStore(s => s.catalogProducts);
  const categories = useAdminStore(s => s.categories);
  const addProduct = useAdminStore(s => s.addProduct);
  const updateProduct = useAdminStore(s => s.updateProduct);

  const existing = !isNew ? products.find(p => p.id === productId) : null;

  const [form, setForm] = useState({
    name: '',
    subtitle: '',
    description: '',
    price: '',
    categoryId: categories[0]?.id ?? '',
    sizesStr: 'S, M, L, XL',
    imagesStr: '',
    collection: 'cowboys',
    category: 'ТОЛСТОВКИ И ХУДИ',
    stockStr: '',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existing) {
      const stockStr = Object.entries(existing.stockBySize ?? {})
        .map(([k, v]) => `${k}:${v}`).join(', ');
      setForm({
        name: existing.name ?? '',
        subtitle: existing.subtitle ?? '',
        description: existing.description ?? '',
        price: String(existing.price ?? ''),
        categoryId: existing.categoryId ?? categories[0]?.id,
        sizesStr: (existing.sizes ?? []).join(', '),
        imagesStr: (existing.images ?? []).join('\n'),
        collection: existing.collection ?? 'cowboys',
        category: existing.category ?? '',
        stockStr,
      });
    }
  }, [existing, categories]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const parseStock = (sizes, stockStr) => {
    const map = {};
    const pairs = stockStr.split(',').map(s => s.trim()).filter(Boolean);
    for (const p of pairs) {
      const [size, qty] = p.split(':').map(x => x.trim());
      if (size && qty) map[size] = Number(qty) || 0;
    }
    for (const s of sizes) {
      if (map[s] == null) map[s] = 5;
    }
    return map;
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const sizes = form.sizesStr.split(',').map(s => s.trim()).filter(Boolean);
      const urlImages = form.imagesStr.split('\n').map(s => s.trim()).filter(Boolean);
      const targetId = isNew
        ? `p-${Date.now().toString(36)}`
        : productId;

      let images = [...urlImages];
      if (imageFiles.length && isSupabaseConfigured()) {
        const uploaded = await uploadProductImages(imageFiles, targetId);
        images = [...images, ...uploaded];
      }

      const payload = {
        name: form.name,
        subtitle: form.subtitle,
        description: form.description,
        price: Number(form.price) || 0,
        categoryId: form.categoryId,
        sizes,
        images: images.length ? images : undefined,
        collection: form.collection,
        category: form.category,
        photoKind: 'product',
        photoId: 0,
        stockBySize: parseStock(sizes, form.stockStr),
      };

      if (isNew) {
        await addProduct({ ...payload, id: targetId });
      } else {
        await updateProduct(productId, payload);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err.message ?? 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Link to="/admin/products"><Caps size={10} weight={700} color="var(--erd-muted)">← ТОВАРЫ</Caps></Link>
      <Caps size={12} weight={800} style={{ display: 'block', marginTop: 10 }}>
        {isNew ? 'НОВЫЙ ТОВАР' : 'РЕДАКТИРОВАНИЕ'}
      </Caps>

      <form onSubmit={save} style={{ marginTop: 16, background: '#fff', border: '1px solid var(--erd-rule)', padding: 16 }}>
        <Caps size={9} weight={700} color="var(--erd-muted)">НАЗВАНИЕ</Caps>
        <input required value={form.name} onChange={e => set('name', e.target.value)} style={fieldStyle} />

        <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 14 }}>ПОДЗАГОЛОВОК / ЦВЕТ</Caps>
        <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} style={fieldStyle} />

        <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 14 }}>ОПИСАНИЕ</Caps>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} style={{ ...fieldStyle, resize: 'vertical', minHeight: 80 }} />

        <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 14 }}>ЦЕНА (₽)</Caps>
        <input required type="number" value={form.price} onChange={e => set('price', e.target.value)} style={fieldStyle} />

        <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 14 }}>КАТЕГОРИЯ</Caps>
        <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} style={{ ...fieldStyle, marginTop: 6 }}>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 14 }}>КОЛЛЕКЦИЯ</Caps>
        <input value={form.collection} onChange={e => set('collection', e.target.value)} style={fieldStyle} placeholder="cowboys / homme / femme" />

        <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 14 }}>ТИП (ФИЛЬТР)</Caps>
        <input value={form.category} onChange={e => set('category', e.target.value)} style={fieldStyle} placeholder="ТОЛСТОВКИ И ХУДИ" />

        <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 14 }}>РАЗМЕРЫ (ЧЕРЕЗ ЗАПЯТУЮ)</Caps>
        <input value={form.sizesStr} onChange={e => set('sizesStr', e.target.value)} style={fieldStyle} />

        <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 14 }}>ОСТАТКИ (S:5, M:3)</Caps>
        <input value={form.stockStr} onChange={e => set('stockStr', e.target.value)} style={fieldStyle} placeholder="S:5, M:3, L:2" />

        <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 14 }}>ФОТО — ЗАГРУЗКА В SUPABASE STORAGE</Caps>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={e => setImageFiles(Array.from(e.target.files ?? []))}
          style={{ marginTop: 8, fontSize: 12 }}
        />
        {imageFiles.length > 0 && (
          <Caps size={8} weight={600} color="var(--erd-muted)" style={{ display: 'block', marginTop: 6 }}>
            Выбрано файлов: {imageFiles.length}
          </Caps>
        )}

        <Caps size={9} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 14 }}>ФОТО — URL (ПО СТРОКЕ, ОПЦИОНАЛЬНО)</Caps>
        <textarea value={form.imagesStr} onChange={e => set('imagesStr', e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical' }} />

        {error && (
          <Caps size={9} weight={700} color="var(--erd-ox)" style={{ display: 'block', marginTop: 12 }}>
            {error}
          </Caps>
        )}

        <div style={{ marginTop: 20 }}>
          <CTA onClick={save} disabled={saving}>
            {saving ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ'}
          </CTA>
        </div>
      </form>
    </div>
  );
}
