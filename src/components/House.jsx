// import { useEffect, useRef, useCallback } from 'react';

// // ─── PixelSprites ────────────────────────────────────────────────────────────
// // Exactly 2 pixel houses that patrol the border of the viewport.
// // They never enter the middle of the page.
// // pointer-events: none — zero interference with clicks.

// const MARGIN = 48; // how far inside the edge they walk

// // Two house palettes
// const PALETTES = [
//   { body: '#1a6b4a', roof: '#4fffb0', door: '#0d3d2a', win: '#b6ffd8' },
//   { body: '#1a3a6b', roof: '#60b4ff', door: '#0d1f3d', win: '#b6d8ff' },
// ];

// // House pixel-art SVG (same crisp style as the cursor)
// function makeHouseSVG(p) {
//   return `<svg width="44" height="52" viewBox="0 0 11 13" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
//   <rect x="1" y="6" width="9" height="7" fill="${p.body}"/>
//   <polygon points="0,7 5.5,1 11,7" fill="${p.roof}"/>
//   <rect x="8" y="3" width="1.5" height="3" fill="${p.roof}"/>
//   <rect x="4.5" y="9" width="2" height="4" fill="${p.door}"/>
//   <circle cx="6.2" cy="11" r="0.35" fill="${p.body}"/>
//   <rect x="1.5" y="7.5" width="2" height="2" fill="${p.win}"/>
//   <rect x="7.5" y="7.5" width="2" height="2" fill="${p.win}"/>
// </svg>`;
// }

// // Border patrol: given progress t ∈ [0,1), return {x, y, facingRight}
// // Path: top-left → top-right → bottom-right → bottom-left → back
// function borderPos(t, W, H, m) {
//   const top    = W - 2 * m;          // segment length top
//   const right  = H - 2 * m;          // segment length right
//   const bottom = W - 2 * m;          // segment length bottom
//   const left   = H - 2 * m;          // segment length left
//   const total  = top + right + bottom + left;
//   const d      = ((t % 1) + 1) % 1 * total;

//   if (d < top) {
//     // moving right along top
//     return { x: m + d, y: m, facingRight: true };
//   } else if (d < top + right) {
//     // moving down along right
//     return { x: W - m, y: m + (d - top), facingRight: true };
//   } else if (d < top + right + bottom) {
//     // moving left along bottom
//     return { x: W - m - (d - top - right), y: H - m, facingRight: false };
//   } else {
//     // moving up along left
//     return { x: m, y: H - m - (d - top - right - bottom), facingRight: true };
//   }
// }

// const PixelSprites = () => {
//   const canvasRef = useRef(null);
//   const imagesRef = useRef([]);
//   const rafRef    = useRef(null);
//   const lastTs    = useRef(0);
//   // Each house has its own progress along the border (offset so they don't overlap)
//   const progressRef = useRef([0, 0.5]);
//   const SPEED = 0.000028; // fraction of border per ms

//   const preload = useCallback((done) => {
//     let loaded = 0;
//     PALETTES.forEach((p, i) => {
//       const img = new Image();
//       img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(makeHouseSVG(p));
//       img.onload = () => { if (++loaded === PALETTES.length) done(); };
//       imagesRef.current[i] = img;
//     });
//   }, []);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext('2d');

//     const resize = () => {
//       canvas.width  = window.innerWidth;
//       canvas.height = window.innerHeight;
//     };
//     resize();
//     window.addEventListener('resize', resize);

//     preload(() => {
//       const tick = (ts) => {
//         const dt = Math.min(ts - lastTs.current, 40);
//         lastTs.current = ts;
//         const W = canvas.width, H = canvas.height;
//         ctx.clearRect(0, 0, W, H);
//         const now = ts;

//         progressRef.current = progressRef.current.map((p) => p + SPEED * dt);

//         progressRef.current.forEach((prog, idx) => {
//           const p   = PALETTES[idx];
//           const img = imagesRef.current[idx];
//           if (!img?.complete) return;

//           const { x, y, facingRight } = borderPos(prog, W, H, MARGIN);
//           const sw = 44, sh = 52;
//           const cx = x, cy = y;

//           // wobble
//           const wobble = Math.sin(now * 0.004 + idx * 2.1) * 2.5;
//           // arm swing
//           const arm = Math.sin(now * 0.006 + idx * 1.7) * 20;
//           // leg lift
//           const leg = Math.sin(now * 0.006 + idx * 1.7) * 4;

//           ctx.save();
//           ctx.globalAlpha = 0.72;
//           ctx.translate(cx, cy + wobble);
//           if (!facingRight) ctx.scale(-1, 1);

//           // left arm
//           ctx.save();
//           ctx.translate(-sw * 0.46, sh * 0.06);
//           ctx.rotate((-28 + arm) * Math.PI / 180);
//           ctx.fillStyle = p.body;
//           ctx.fillRect(-2.5, 0, 5, sh * 0.27);
//           ctx.beginPath();
//           ctx.arc(0, sh * 0.27, 5, 0, Math.PI * 2);
//           ctx.fillStyle = p.roof;
//           ctx.fill();
//           ctx.restore();

//           // right arm
//           ctx.save();
//           ctx.translate(sw * 0.46, sh * 0.06);
//           ctx.rotate((28 - arm) * Math.PI / 180);
//           ctx.fillStyle = p.body;
//           ctx.fillRect(-2.5, 0, 5, sh * 0.27);
//           ctx.beginPath();
//           ctx.arc(0, sh * 0.27, 5, 0, Math.PI * 2);
//           ctx.fillStyle = p.roof;
//           ctx.fill();
//           ctx.restore();

//           // body sprite
//           ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh);

//           // legs
//           ctx.fillStyle = p.body;
//           ctx.fillRect(-sw * 0.17, sh * 0.44, sw * 0.13, sh * 0.22 + leg);
//           ctx.fillRect( sw * 0.04, sh * 0.44, sw * 0.13, sh * 0.22 - leg);
//           // feet
//           ctx.fillStyle = p.roof;
//           ctx.fillRect(-sw * 0.21, sh * 0.44 + sh * 0.22 + leg - 2, sw * 0.2, 5);
//           ctx.fillRect( sw * 0.00, sh * 0.44 + sh * 0.22 - leg - 2, sw * 0.2, 5);

//           // chimney smoke puff
//           const smoke = Math.abs(Math.sin(now * 0.003 + idx));
//           ctx.save();
//           ctx.globalAlpha = smoke * 0.5;
//           ctx.fillStyle = p.roof;
//           ctx.beginPath();
//           ctx.arc(sw * 0.28, -sh * 0.54 - smoke * 6, 3 + smoke * 2, 0, Math.PI * 2);
//           ctx.fill();
//           ctx.restore();

//           ctx.restore();
//         });

//         rafRef.current = requestAnimationFrame(tick);
//       };

//       rafRef.current = requestAnimationFrame(tick);
//     });

//     return () => {
//       window.removeEventListener('resize', resize);
//       cancelAnimationFrame(rafRef.current);
//     };
//   }, [preload]);

//   return (
//     <canvas
//       ref={canvasRef}
//       style={{
//         position: 'fixed',
//         inset: 0,
//         width: '100%',
//         height: '100%',
//         pointerEvents: 'none',
//         zIndex: 0,
//       }}
//       aria-hidden="true"
//     />
//   );
// };

// export default PixelSprites;


import { useEffect, useRef, useCallback } from 'react';

// ─── PixelSprites ────────────────────────────────────────────────────────────
// Exactly 2 pixel houses that patrol the border of the viewport.
// They never enter the middle of the page.
// pointer-events: none — zero interference with clicks.

const MARGIN = 48; // how far inside the edge they walk

// Two house palettes
const PALETTES = [
  { body: '#1a6b4a', roof: '#4fffb0', door: '#0d3d2a', win: '#b6ffd8' },
  { body: '#1a3a6b', roof: '#60b4ff', door: '#0d1f3d', win: '#b6d8ff' },
];

// House pixel-art SVG (same crisp style as the cursor)
function makeHouseSVG(p) {
  return `<svg width="44" height="52" viewBox="0 0 11 13" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <rect x="1" y="6" width="9" height="7" fill="${p.body}"/>
  <polygon points="0,7 5.5,1 11,7" fill="${p.roof}"/>
  <rect x="8" y="3" width="1.5" height="3" fill="${p.roof}"/>
  <rect x="4.5" y="9" width="2" height="4" fill="${p.door}"/>
  <circle cx="6.2" cy="11" r="0.35" fill="${p.body}"/>
  <rect x="1.5" y="7.5" width="2" height="2" fill="${p.win}"/>
  <rect x="7.5" y="7.5" width="2" height="2" fill="${p.win}"/>
</svg>`;
}

// Border patrol: given progress t ∈ [0,1), return {x, y, facingRight}
// Path: top-left → top-right → bottom-right → bottom-left → back
function borderPos(t, W, H, m) {
  const top    = W - 2 * m;          // segment length top
  const right  = H - 2 * m;          // segment length right
  const bottom = W - 2 * m;          // segment length bottom
  const left   = H - 2 * m;          // segment length left
  const total  = top + right + bottom + left;
  const d      = ((t % 1) + 1) % 1 * total;

  if (d < top) {
    // moving right along top
    return { x: m + d, y: m, facingRight: true };
  } else if (d < top + right) {
    // moving down along right
    return { x: W - m, y: m + (d - top), facingRight: true };
  } else if (d < top + right + bottom) {
    // moving left along bottom
    return { x: W - m - (d - top - right), y: H - m, facingRight: false };
  } else {
    // moving up along left
    return { x: m, y: H - m - (d - top - right - bottom), facingRight: true };
  }
}

const PixelSprites = () => {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const rafRef    = useRef(null);
  const lastTs    = useRef(0);
  // Each house has its own progress along the border (offset so they don't overlap)
  const progressRef = useRef([0, 0.5]);
  const SPEED = 0.000028; // fraction of border per ms

  const preload = useCallback((done) => {
    let loaded = 0;
    PALETTES.forEach((p, i) => {
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(makeHouseSVG(p));
      img.onload = () => { if (++loaded === PALETTES.length) done(); };
      imagesRef.current[i] = img;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    preload(() => {
      const tick = (ts) => {
        const dt = Math.min(ts - lastTs.current, 40);
        lastTs.current = ts;
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        const now = ts;

        progressRef.current = progressRef.current.map((p) => p + SPEED * dt);

        progressRef.current.forEach((prog, idx) => {
          const p   = PALETTES[idx];
          const img = imagesRef.current[idx];
          if (!img?.complete) return;

          const { x, y, facingRight } = borderPos(prog, W, H, MARGIN);
          const sw = 44, sh = 52;
          const cx = x, cy = y;

          // wobble
          const wobble = Math.sin(now * 0.004 + idx * 2.1) * 2.5;
          // arm swing
          const arm = Math.sin(now * 0.006 + idx * 1.7) * 20;
          // leg lift
          const leg = Math.sin(now * 0.006 + idx * 1.7) * 4;

          ctx.save();
          ctx.globalAlpha = 0.72;
          ctx.translate(cx, cy + wobble);
          if (!facingRight) ctx.scale(-1, 1);

          // left arm
          ctx.save();
          ctx.translate(-sw * 0.46, sh * 0.06);
          ctx.rotate((-28 + arm) * Math.PI / 180);
          ctx.fillStyle = p.body;
          ctx.fillRect(-2.5, 0, 5, sh * 0.27);
          ctx.beginPath();
          ctx.arc(0, sh * 0.27, 5, 0, Math.PI * 2);
          ctx.fillStyle = p.roof;
          ctx.fill();
          ctx.restore();

          // right arm
          ctx.save();
          ctx.translate(sw * 0.46, sh * 0.06);
          ctx.rotate((28 - arm) * Math.PI / 180);
          ctx.fillStyle = p.body;
          ctx.fillRect(-2.5, 0, 5, sh * 0.27);
          ctx.beginPath();
          ctx.arc(0, sh * 0.27, 5, 0, Math.PI * 2);
          ctx.fillStyle = p.roof;
          ctx.fill();
          ctx.restore();

          // body sprite
          ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh);

          // legs
          ctx.fillStyle = p.body;
          ctx.fillRect(-sw * 0.17, sh * 0.44, sw * 0.13, sh * 0.22 + leg);
          ctx.fillRect( sw * 0.04, sh * 0.44, sw * 0.13, sh * 0.22 - leg);
          // feet
          ctx.fillStyle = p.roof;
          ctx.fillRect(-sw * 0.21, sh * 0.44 + sh * 0.22 + leg - 2, sw * 0.2, 5);
          ctx.fillRect( sw * 0.00, sh * 0.44 + sh * 0.22 - leg - 2, sw * 0.2, 5);

          // chimney smoke puff
          const smoke = Math.abs(Math.sin(now * 0.003 + idx));
          ctx.save();
          ctx.globalAlpha = smoke * 0.5;
          ctx.fillStyle = p.roof;
          ctx.beginPath();
          ctx.arc(sw * 0.28, -sh * 0.54 - smoke * 6, 3 + smoke * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          ctx.restore();
        });

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    });

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [preload]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 99998,
      }}
      aria-hidden="true"
    />
  );
};

export default PixelSprites;