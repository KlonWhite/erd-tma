import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Wordmark from '../components/Wordmark.jsx';
import Caps from '../components/Caps.jsx';
import useStore from '../store/useStore.js';

export default function Splash() {
  const navigate = useNavigate();
  const onboardingDone = useStore(s => s.onboardingDone);
  const bar = useRef(null);

  useEffect(() => {
    // Animate loading bar
    if (bar.current) {
      bar.current.style.transition = 'width 1.4s ease-in-out';
      bar.current.style.width = '100%';
    }
    const timer = setTimeout(() => {
      navigate(onboardingDone ? '/home' : '/onboarding', { replace: true });
    }, 1600);
    return () => clearTimeout(timer);
  }, [navigate, onboardingDone]);

  return (
    <div className="screen screen--no-nav" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '80px 28px',
      paddingTop: 'calc(80px + var(--safe-top))',
      paddingBottom: 'calc(80px + var(--safe-bottom))',
      background: 'var(--erd-paper)',
      height: '100%',
    }}>
      <Caps size={9} weight={700} color="var(--erd-muted)">EST. PARIS · MMXII</Caps>

      <Wordmark size={42} style={{ transform: 'scaleX(0.9)', transformOrigin: 'left center' }} />

      <div>
        <div style={{
          width: 140,
          height: 1,
          background: 'rgba(0,0,0,0.2)',
          marginBottom: 12,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div ref={bar} style={{
            position: 'absolute', left: 0, top: 0,
            height: '100%', width: '0%',
            background: 'var(--erd-ink)',
          }} />
        </div>
        <Caps size={9} weight={700} color="var(--erd-muted)">ЗАГРУЗКА — F/W 26</Caps>
      </div>
    </div>
  );
}
