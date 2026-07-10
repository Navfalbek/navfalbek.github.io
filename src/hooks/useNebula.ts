import { useEffect, type RefObject } from 'react';
import { loadPlate } from '../lib/plate';

// Photoreal nebula plates (generated with Higgsfield, decoded to additive
// sprites in loadPlate). Each cloud is drawn twice — the body plus a larger,
// fainter, counter-rotating "veil" copy — so the gas has parallax depth
// instead of reading as a flat photo.
interface NebulaDef {
  src: string;
  x: number; // position as viewport fraction
  y: number;
  size: number; // diameter as fraction of max(vw, vh)
  alpha: number;
  speed: number; // drift speed
  phase: number;
  rotSpeed: number; // rad/s, very slow
  flip: boolean; // mirror the plate so a reused texture reads as a new cloud
}

const NEBULAE: NebulaDef[] = [
  {
    src: '/space/nebula-teal.webp',
    x: 0.16,
    y: 0.14,
    size: 1.0,
    alpha: 0.95,
    speed: 0.05,
    phase: 0.7,
    rotSpeed: 0.0035,
    flip: false,
  },
  {
    src: '/space/nebula-violet.webp',
    x: 0.88,
    y: 0.42,
    size: 1.1,
    alpha: 0.9,
    speed: 0.04,
    phase: 2.3,
    rotSpeed: -0.0028,
    flip: false,
  },
  {
    src: '/space/nebula-crimson.webp',
    x: 0.28,
    y: 0.92,
    size: 1.15,
    alpha: 0.95,
    speed: 0.035,
    phase: 4.1,
    rotSpeed: 0.0024,
    flip: false,
  },
  // The crimson plate again, mirrored and smaller: a distant warm cloud.
  {
    src: '/space/nebula-crimson.webp',
    x: 0.6,
    y: 0.5,
    size: 0.62,
    alpha: 0.42,
    speed: 0.055,
    phase: 5.6,
    rotSpeed: -0.0032,
    flip: true,
  },
];

/**
 * Full-viewport canvas of photorealistic nebulae. Each plate drifts, rotates
 * and breathes almost imperceptibly, while its veil layer slides against the
 * body so the gases appear to churn. The wrapper layer's opacity/scale is
 * driven by `useScrollScene`, so the clouds bloom into view on scroll.
 */
export function useNebula(canvasRef: RefObject<HTMLCanvasElement>): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // One decode per unique file; defs sharing a src share the sprite.
    const srcs = Array.from(new Set(NEBULAE.map((n) => n.src)));
    const sprites = new Map<string, HTMLCanvasElement>();
    let disposed = false;
    for (const src of srcs) {
      loadPlate(src, 0.8)
        .then((sprite) => {
          if (!disposed) sprites.set(src, sprite);
        })
        .catch(() => {
          /* cloud simply stays absent */
        });
    }

    let W = 0;
    let H = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = canvas.width = Math.floor(window.innerWidth * dpr);
      H = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    };
    resize();

    let raf = 0;
    const draw = (now: number) => {
      const t = now * 0.001;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const base = Math.max(W, H);

      for (const n of NEBULAE) {
        const sprite = sprites.get(n.src);
        if (!sprite) continue;

        const px = n.x * W + Math.sin(t * n.speed + n.phase) * W * 0.018;
        const py = n.y * H + Math.cos(t * n.speed * 0.8 + n.phase) * H * 0.018;
        const s = n.size * base * (1 + 0.025 * Math.sin(t * n.speed * 0.6 + n.phase * 2));
        // Slow luminosity shimmer, as if the gas were lit from within.
        const glow = n.alpha * (0.88 + 0.12 * Math.sin(t * n.speed * 1.7 + n.phase * 3));

        ctx.save();
        ctx.translate(px, py);
        if (n.flip) ctx.scale(-1, 1);

        // Veil: enlarged, faint, counter-rotating copy behind the body.
        ctx.save();
        ctx.rotate(-t * n.rotSpeed * 0.6 + n.phase * 1.7);
        ctx.globalAlpha = glow * 0.3;
        const vs = s * 1.24;
        ctx.drawImage(sprite, -vs / 2, -vs / 2, vs, vs);
        ctx.restore();

        // Body.
        ctx.rotate(t * n.rotSpeed + n.phase);
        ctx.globalAlpha = glow;
        ctx.drawImage(sprite, -s / 2, -s / 2, s, s);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(draw);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef]);
}
