export default function Rule({ color = 'var(--erd-rule)', mt = 0, mb = 0 }) {
  return (
    <div style={{
      height: 1,
      background: color,
      marginTop: mt,
      marginBottom: mb,
      flexShrink: 0,
    }} />
  );
}
