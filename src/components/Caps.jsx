export default function Caps({ children, size = 11, weight = 700, color, style, as: Tag = 'span' }) {
  return (
    <Tag style={{
      fontFamily: 'var(--font-sans)',
      fontSize: size,
      fontWeight: weight,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: color,
      ...style,
    }}>
      {children}
    </Tag>
  );
}
