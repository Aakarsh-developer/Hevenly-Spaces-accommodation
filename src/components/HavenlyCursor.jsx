import { useEffect, useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

// ─── Custom cursor: a tiny pixel house with a key ────────────────────────────
// Drop <HavenlyCursor /> once at the root of your app (inside <BrowserRouter>
// but outside all page content). It hides the native cursor globally and
// renders a custom SVG cursor that follows the mouse with spring physics.

const HavenlyCursor = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);
  const rawX = useRef(-100);
  const rawY = useRef(-100);

  const springCfg = { stiffness: 520, damping: 36, mass: 0.6 };
  const x = useSpring(rawX.current, springCfg);
  const y = useSpring(rawY.current, springCfg);

  useEffect(() => {
    // Hide native cursor globally
    const style = document.createElement('style');
    style.id = 'havenly-cursor-hide';
    style.textContent = '*, *::before, *::after { cursor: none !important; }';
    document.head.appendChild(style);

    const onMove = (e) => {
      rawX.current = e.clientX;
      rawY.current = e.clientY;
      x.set(e.clientX);
      y.set(e.clientY);
      setPos({ x: e.clientX, y: e.clientY });

      // Detect hoverable elements
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const isHover = el && (
        el.closest('a, button, [role="button"], input, select, textarea, label') !== null ||
        el.closest('[class*="btn"]') !== null
      );
      setHovering(!!isHover);
    };

    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.getElementById('havenly-cursor-hide')?.remove();
    };
  }, []);

  return (
    <motion.div
      style={{
        x,
        y,
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 99999,
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
      <motion.svg
        width={hovering ? 36 : 28}
        height={hovering ? 36 : 28}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{
          scale: clicking ? 0.78 : hovering ? 1.18 : 1,
          rotate: hovering ? -12 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.55))' }}
      >
        {/* House body */}
        <rect x="6" y="14" width="20" height="14" rx="2" fill="#0d3d2a" />

        {/* Roof */}
        <path d="M3 15 L16 4 L29 15" fill="#1a6b4a" />
        <path d="M3 15 L16 4 L29 15" stroke="#4fffb0" strokeWidth="1.2" fill="none" strokeLinejoin="round" />

        {/* Door */}
        <rect x="12" y="20" width="8" height="8" rx="1" fill="#4fffb0" opacity="0.9" />
        <rect x="12" y="20" width="8" height="8" rx="1" stroke="#0d3d2a" strokeWidth="0.8" fill="none" />

        {/* Door knob */}
        <circle cx="19" cy="24" r="1" fill="#0d3d2a" />

        {/* Window left */}
        <rect x="7" y="17" width="4" height="4" rx="0.5" fill="#4fffb0" opacity="0.5" />

        {/* Window right */}
        <rect x="21" y="17" width="4" height="4" rx="0.5" fill="#4fffb0" opacity="0.5" />

        {/* Chimney */}
        <rect x="20" y="6" width="3" height="6" rx="0.5" fill="#1a6b4a" />

        {/* Chimney smoke dots */}
        <motion.circle
          cx="21.5"
          cy="4"
          r="1.2"
          fill="#4fffb0"
          opacity="0.7"
          animate={{ y: [-2, -5, -2], opacity: [0.7, 0.2, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Key shape — bottom right of house */}
        <g transform="translate(22, 22)">
          {/* Key ring */}
          <circle cx="0" cy="0" r="2.5" stroke="#4fffb0" strokeWidth="1.2" fill="none" />
          {/* Key shaft */}
          <line x1="2.5" y1="0" x2="7" y2="0" stroke="#4fffb0" strokeWidth="1.2" strokeLinecap="round" />
          {/* Key teeth */}
          <line x1="5" y1="0" x2="5" y2="2" stroke="#4fffb0" strokeWidth="1" strokeLinecap="round" />
          <line x1="6.5" y1="0" x2="6.5" y2="1.5" stroke="#4fffb0" strokeWidth="1" strokeLinecap="round" />
        </g>

        {/* Hover: star sparkle */}
        {hovering && (
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, rotate: [0, 180] }}
            transition={{ duration: 0.3 }}
          >
            <path d="M28 3 L28.6 4.8 L30.5 4.8 L29 6 L29.6 7.8 L28 6.7 L26.4 7.8 L27 6 L25.5 4.8 L27.4 4.8 Z"
              fill="#4fffb0" opacity="0.9" />
          </motion.g>
        )}
      </motion.svg>
    </motion.div>
  );
};

export default HavenlyCursor;
