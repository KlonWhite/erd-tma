import { useEffect, useState } from 'react';
import Caps from '../../components/Caps.jsx';
import useAdminStore from '../adminStore.js';
import {
  formatExpiresAt,
  formatPromoLabel,
  getPromoUsageCount,
  isPromoExpired,
  toDateInputValue,
} from '../promoRegistry.js';

const card = { background: '#fff', border: '1px solid var(--erd-rule)', padding: '12px 14px' };

const inputStyle = {
  width: '100%',
  marginTop: 6,
  padding: '8px 0',
  border: 'none',
  borderBottom: '1px solid var(--erd-rule)',
  fontFamily: 'var(--font-sans)',
  fontWeight: 700,
  fontSize: 12,
  textTransform: 'uppercase',
  outline: 'none',
};

const emptyForm = {
  code: '',
  value: '',
  maxUses: '',
  expiresAt: '',
  active: true,
};

export default function PromosPage() {
  const promos = useAdminStore(s => s.promos);
  const addPromo = useAdminStore(s => s.addPromo);
  const updatePromo = useAdminStore(s => s.updatePromo);
  const deletePromo = useAdminStore(s => s.deletePromo);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [usageMap, setUsageMap] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        promos.map(async p => [p.code, await getPromoUsageCount(p.code)]),
      );
      if (!cancelled) setUsageMap(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [promos]);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const submit = (e) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    if (!code) return;

    const percent = Number(form.value);
    if (!percent || percent < 1 || percent > 100) {
      alert('Укажите процент скидки от 1 до 100');
      return;
    }

    const existing = editId ? promos.find(p => p.id === editId) : null;
    const payload = {
      code: existing?.code ?? code,
      type: existing?.type === 'fixed' ? 'fixed' : 'percent',
      value: existing?.type === 'fixed' ? existing.value : percent,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      expiresAt: form.expiresAt || null,
      active: form.active,
    };

    try {
      if (editId) {
        updatePromo(editId, payload);
        setEditId(null);
      } else {
        addPromo(payload);
      }
      setForm(emptyForm);
    } catch (err) {
      alert(err.message || 'Ошибка сохранения');
    }
  };

  const startEdit = (p) => {
    setEditId(p.id);
    setForm({
      code: p.code,
      value: String(p.value),
      maxUses: p.maxUses != null ? String(p.maxUses) : '',
      expiresAt: toDateInputValue(p.expiresAt),
      active: p.active,
    });
  };

  return (
    <div>
      <Caps size={12} weight={800}>ПРОМОКОДЫ</Caps>
      <Caps size={9} weight={600} color="var(--erd-muted)" style={{ display: 'block', marginTop: 6 }}>
        Код · % скидки · лимит использований · срок действия
      </Caps>

      <form onSubmit={submit} style={{ ...card, marginTop: 14 }}>
        <Caps size={9} weight={700} color="var(--erd-muted)">
          {editId ? 'РЕДАКТИРОВАТЬ' : 'НОВЫЙ ПРОМОКОД'}
        </Caps>

        <Caps size={8} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 10 }}>ПРОМО-КОД</Caps>
        <input
          value={form.code}
          onChange={e => setField('code', e.target.value.toUpperCase())}
          placeholder="KOVBOI10"
          style={inputStyle}
          disabled={!!editId}
        />

        <Caps size={8} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 10 }}>ПРОЦЕНТ СКИДКИ</Caps>
        <input
          type="number"
          min={1}
          max={100}
          value={form.value}
          onChange={e => setField('value', e.target.value)}
          placeholder="10"
          style={{ ...inputStyle, textTransform: 'none' }}
        />

        <Caps size={8} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 10 }}>МАКС. ИСПОЛЬЗОВАНИЙ</Caps>
        <input
          type="number"
          min={1}
          value={form.maxUses}
          onChange={e => setField('maxUses', e.target.value)}
          placeholder="БЕЗ ЛИМИТА"
          style={{ ...inputStyle, textTransform: 'none' }}
        />

        <Caps size={8} weight={700} color="var(--erd-muted)" style={{ display: 'block', marginTop: 10 }}>ДАТА ИСТЕЧЕНИЯ</Caps>
        <input
          type="date"
          value={form.expiresAt}
          onChange={e => setField('expiresAt', e.target.value)}
          style={{ ...inputStyle, textTransform: 'none' }}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <input
            type="checkbox"
            checked={form.active}
            onChange={e => setField('active', e.target.checked)}
          />
          <Caps size={9} weight={700}>АКТИВЕН</Caps>
        </label>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="submit" style={{ border: '1px solid var(--erd-ink)', background: 'var(--erd-ink)', color: '#fff', padding: '8px 14px', cursor: 'pointer' }}>
            <Caps size={9} weight={800}>{editId ? 'СОХРАНИТЬ' : 'СОЗДАТЬ'}</Caps>
          </button>
          {editId && (
            <button type="button" onClick={() => { setEditId(null); setForm(emptyForm); }} style={{ border: '1px solid var(--erd-rule)', background: 'transparent', padding: '8px 14px', cursor: 'pointer' }}>
              <Caps size={9} weight={700}>ОТМЕНА</Caps>
            </button>
          )}
        </div>
      </form>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {promos.map(p => {
          const used = usageMap[p.code] ?? 0;
          const expired = isPromoExpired(p.expiresAt);
          const limitReached = p.maxUses != null && used >= p.maxUses;

          return (
            <div key={p.id} style={{ ...card, opacity: p.active && !expired ? 1 : 0.55 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Caps size={12} weight={800}>{p.code}</Caps>
                  <Caps size={9} weight={700} color="var(--erd-ox)" style={{ display: 'block', marginTop: 4 }}>
                    {p.type === 'percent'
                      ? `Скидка ${p.value}%`
                      : (p.label || formatPromoLabel(p))}
                  </Caps>
                  <Caps size={8} weight={600} color="var(--erd-muted)" style={{ display: 'block', marginTop: 4 }}>
                    Использовано: {used}
                    {p.maxUses != null ? ` / ${p.maxUses}` : ' · без лимита'}
                  </Caps>
                  <Caps size={8} weight={600} color="var(--erd-muted)" style={{ display: 'block', marginTop: 2 }}>
                    Действует до: {formatExpiresAt(p.expiresAt)}
                  </Caps>
                  <Caps size={8} weight={700} color={expired ? 'var(--erd-ox)' : limitReached ? '#8a6a00' : '#2a6a3a'} style={{ display: 'block', marginTop: 4 }}>
                    {expired ? '○ ИСТЁК' : limitReached ? '○ ЛИМИТ' : p.active ? '● АКТИВЕН' : '○ ВЫКЛ'}
                  </Caps>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <button type="button" onClick={() => startEdit(p)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Caps size={9} weight={700}>ИЗМ.</Caps>
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePromo(p.id, { active: !p.active })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <Caps size={9} weight={700}>{p.active ? 'ВЫКЛ' : 'ВКЛ'}</Caps>
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (confirm(`Удалить ${p.code}?`)) deletePromo(p.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <Caps size={9} weight={700} color="var(--erd-ox)">УДАЛ.</Caps>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {promos.length === 0 && (
          <Caps size={10} weight={700} color="var(--erd-muted)">НЕТ ПРОМОКОДОВ</Caps>
        )}
      </div>
    </div>
  );
}
