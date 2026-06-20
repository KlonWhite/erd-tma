import { useEffect, useRef, useState } from 'react';

/** <img> с плавным появлением после загрузки (учитывает закэшированные изображения). */
export default function FadeImg({ className = '', ...props }) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (ref.current?.complete) setLoaded(true);
  }, []);

  return (
    <img
      ref={ref}
      {...props}
      onLoad={() => setLoaded(true)}
      className={`erd-img-fade${loaded ? ' is-loaded' : ''}${className ? ` ${className}` : ''}`}
    />
  );
}
