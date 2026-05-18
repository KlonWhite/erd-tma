const EDITORIALS = [
  { bg: '#1a1a1a', fg: '#0a0a0a', accent: '#3a3530' },
  { bg: '#d8d2c4', fg: '#0a0a0a', accent: '#7a0d0d' },
  { bg: '#2a2520', fg: '#1a1612', accent: '#5a4a3a' },
  { bg: '#0a0a0a', fg: '#1a1a1a', accent: '#7a0d0d' },
  { bg: '#a89d8a', fg: '#3a3530', accent: '#6a5a4a' },
  { bg: '#1a1612', fg: '#0a0a0a', accent: '#aaa098' },
];

const GARMENTS = [
  { body: '#f4f1e8', sleeves: '#1f4ea0', detail: '#1a1a1a' },
  { body: '#0a0a0a', sleeves: '#0a0a0a', detail: '#7a0d0d' },
  { body: '#3a3530', sleeves: '#2a2520', detail: '#7a6a5a' },
  { body: '#d8d2c4', sleeves: '#c8c2b4', detail: '#1a1a1a' },
  { body: '#1a1612', sleeves: '#1a1612', detail: '#a89d8a' },
  { body: '#a89d8a', sleeves: '#988a78', detail: '#3a3530' },
];

export default function PhotoPlaceholder({ id = 0, kind = 'editorial', label, style }) {
  if (kind === 'product') {
    const g = GARMENTS[id % GARMENTS.length];
    return (
      <div style={{
        aspectRatio: '4 / 5',
        width: '100%',
        position: 'relative',
        background: '#fff',
        overflow: 'hidden',
        ...style,
      }}>
        <div style={{
          position: 'absolute', top: '20%', left: '50%',
          transform: 'translateX(-50%)',
          width: '70%', aspectRatio: '0.95',
        }}>
          <div style={{
            position: 'absolute', top: '8%', left: '-12%',
            width: '34%', height: '44%',
            background: g.sleeves,
            clipPath: 'polygon(0 0, 100% 8%, 90% 100%, 10% 95%)',
            transform: 'rotate(-12deg)',
          }} />
          <div style={{
            position: 'absolute', top: '8%', right: '-12%',
            width: '34%', height: '44%',
            background: g.sleeves,
            clipPath: 'polygon(0 8%, 100% 0, 90% 95%, 10% 100%)',
            transform: 'rotate(12deg)',
          }} />
          <div style={{
            position: 'absolute', top: '14%', left: '14%', right: '14%', bottom: 0,
            background: g.body,
            clipPath: 'polygon(0 0, 100% 0, 96% 100%, 4% 100%)',
          }} />
          <div style={{
            position: 'absolute', top: '35%', left: '32%',
            width: '36%', aspectRatio: '1',
            background: `radial-gradient(circle at 40% 40%, ${g.detail}, transparent 60%)`,
            opacity: 0.6,
          }} />
        </div>
        <div style={{
          position: 'absolute', bottom: '8%', left: '20%', right: '20%',
          height: '3%',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15), transparent 70%)',
        }} />
      </div>
    );
  }

  const l = EDITORIALS[id % EDITORIALS.length];
  return (
    <div style={{
      aspectRatio: '3 / 4',
      width: '100%',
      position: 'relative',
      background: l.bg,
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(ellipse at 50% 30%, transparent 0%, ${l.bg} 90%)`,
      }} />
      <div style={{
        position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)',
        width: '22%', aspectRatio: '1', borderRadius: '50%',
        background: `linear-gradient(135deg, ${l.accent}, ${l.fg})`,
      }} />
      <div style={{
        position: 'absolute', top: '32%', left: '50%', transform: 'translateX(-50%)',
        width: '60%', height: '50%',
        background: `linear-gradient(180deg, ${l.fg} 0%, ${l.fg} 60%, ${l.bg} 100%)`,
        clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.18,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
        backgroundSize: '3px 3px',
        mixBlendMode: 'overlay',
      }} />
      {label && (
        <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: '#fff',
          }}>{label}</span>
        </div>
      )}
    </div>
  );
}
