export default function Skeleton({
  width = '100%',
  height = 12,
  radius = 0,
  style,
  className = '',
}) {
  return (
    <div
      aria-hidden="true"
      className={`erd-skeleton${className ? ` ${className}` : ''}`}
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}
