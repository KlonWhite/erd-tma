import Caps from './Caps.jsx';

export default function EmptyState({
  eyebrow = 'ERD',
  title,
  body,
  action,
  onAction,
  symbol = '∅',
  compact = false,
}) {
  return (
    <div
      className="erd-empty-state erd-card-in"
      style={{
        margin: compact ? '16px var(--erd-gutter)' : '28px var(--erd-gutter)',
        padding: compact ? '24px 18px' : '34px 22px',
      }}
    >
      <div className="erd-empty-state__mark">{symbol}</div>
      <Caps size={8} weight={800} color="var(--erd-ox)">{eyebrow}</Caps>
      <div className="erd-empty-state__title">{title}</div>
      {body && (
        <Caps
          size={9}
          weight={700}
          color="var(--erd-muted)"
          style={{ display: 'block', marginTop: 10, lineHeight: 1.6 }}
        >
          {body}
        </Caps>
      )}
      {action && (
        <button type="button" onClick={onAction} className="erd-empty-state__action erd-press">
          <Caps size={10} weight={800}>{action}</Caps>
        </button>
      )}
    </div>
  );
}
