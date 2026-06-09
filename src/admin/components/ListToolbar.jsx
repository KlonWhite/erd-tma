import Caps from '../../components/Caps.jsx';

const searchStyle = {
  width: '100%',
  padding: '10px 0',
  border: 'none',
  borderBottom: '1px solid var(--erd-ink)',
  fontFamily: 'var(--font-sans)',
  fontWeight: 700,
  fontSize: 12,
  textTransform: 'uppercase',
  outline: 'none',
  background: 'transparent',
};

const selectStyle = {
  padding: '8px 10px',
  border: '1px solid var(--erd-rule)',
  fontFamily: 'var(--font-sans)',
  fontWeight: 700,
  fontSize: 11,
  textTransform: 'uppercase',
  background: '#fff',
  cursor: 'pointer',
  flex: 1,
  minWidth: 0,
};

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 10px',
        border: `1px solid ${active ? 'var(--erd-ink)' : 'var(--erd-rule)'}`,
        background: active ? 'var(--erd-ink)' : '#fff',
        color: active ? '#fff' : 'inherit',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      <Caps size={8} weight={700}>{children}</Caps>
    </button>
  );
}

/**
 * @param {{
 *   query?: string,
 *   onQueryChange?: (v: string) => void,
 *   queryPlaceholder?: string,
 *   sort?: string,
 *   onSortChange?: (v: string) => void,
 *   sortOptions?: { value: string, label: string }[],
 *   filters?: { id: string, label: string }[],
 *   activeFilter?: string,
 *   onFilterChange?: (id: string) => void,
 *   count?: number,
 *   total?: number,
 * }} props
 */
export default function ListToolbar({
  query,
  onQueryChange,
  queryPlaceholder = 'ПОИСК',
  sort,
  onSortChange,
  sortOptions = [],
  filters,
  activeFilter,
  onFilterChange,
  count,
  total,
}) {
  const showSearch = onQueryChange != null;
  const showSort = sortOptions.length > 0 && onSortChange != null;
  const showFilters = filters?.length > 0 && onFilterChange != null;

  return (
    <div style={{ marginTop: 12 }}>
      {(showSearch || showSort) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {showSearch && (
            <input
              value={query ?? ''}
              onChange={e => onQueryChange(e.target.value)}
              placeholder={queryPlaceholder}
              style={searchStyle}
            />
          )}
          {showSort && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Caps size={8} weight={700} color="var(--erd-muted)">СОРТИРОВКА</Caps>
              <select value={sort} onChange={e => onSortChange(e.target.value)} style={selectStyle}>
                {sortOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      {showFilters && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: showSearch || showSort ? 12 : 0 }}>
          {filters.map(f => (
            <FilterChip
              key={f.id}
              active={activeFilter === f.id}
              onClick={() => onFilterChange(f.id)}
            >
              {f.label}
            </FilterChip>
          ))}
        </div>
      )}

      {count != null && (
        <Caps size={8} weight={600} color="var(--erd-muted)" style={{ display: 'block', marginTop: 10 }}>
          Показано: {count}{total != null && total !== count ? ` из ${total}` : ''}
        </Caps>
      )}
    </div>
  );
}

export { FilterChip };
