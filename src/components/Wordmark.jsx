export default function Wordmark({ size = 14, color = 'var(--erd-ink)', style }) {
  return (
    <div style={{
      fontFamily: 'var(--font-sans)',
      fontWeight: 900,
      fontSize: size,
      lineHeight: 0.95,
      letterSpacing: '-0.01em',
      color,
      transform: 'scaleX(0.92)',
      transformOrigin: 'left center',
      ...style,
    }}>
      <div>ENFANTS RICHES</div>
      <div style={{ fontStyle: 'italic' }}>DÉPRIMÉS</div>
    </div>
  );
}
