import { useEffect, type RefObject } from 'react';

const PALETTE = ['180,235,255', '160,200,255', '205,185,255', '255,238,225'];
const STAR_COUNT = 520;

interface Star {
  x: number;
  y: number;
  z: number;
  c: string;
}

/**
 * Warp-speed starfield. Stars stream toward the viewer; scrolling adds a burst
 * of velocity so the field surges while you move through the page.
 */
export function useStarfield(canvasRef: RefObject<HTMLCanvasElement>): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let cx = 0;
    let cy = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.width = Math.floor(window.innerWidth * dpr);
      H = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      cx = W / 2;
      cy = H / 2;
    };
    resize();

    const makeStar = (): Star => ({
      x: Math.random() * W - cx,
      y: Math.random() * H - cy,
      z: Math.random() * W,
      c: PALETTE[(Math.random() * PALETTE.length) | 0],
    });
    const stars: Star[] = Array.from({ length: STAR_COUNT }, makeStar);

    let vel = 0;
    let lastY = window.scrollY;
    const onScroll = () => {
      vel += window.scrollY - lastY;
      lastY = window.scrollY;
    };

    let raf = 0;
    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      const sp = W * 0.0009 + Math.min(W * 0.011, Math.abs(vel) * dpr * 0.5);
      for (const s of stars) {
        const pz = s.z;
        s.z -= sp;
        if (s.z < 1) {
          s.x = Math.random() * W - cx;
          s.y = Math.random() * H - cy;
          s.z = W;
          s.c = PALETTE[(Math.random() * PALETTE.length) | 0];
          continue;
        }
        const k = 1 - s.z / W;
        ctx.strokeStyle = 'rgba(' + s.c + ',' + (0.18 + 0.8 * k).toFixed(2) + ')';
        ctx.lineWidth = Math.max(0.5, k * 2.4 * dpr);
        ctx.beginPath();
        ctx.moveTo((s.x / pz) * cx + cx, (s.y / pz) * cy + cy);
        ctx.lineTo((s.x / s.z) * cx + cx, (s.y / s.z) * cy + cy);
        ctx.stroke();
      }
      vel *= 0.9;
      if (Math.abs(vel) < 0.01) vel = 0;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
    };
  }, [canvasRef]);
}
