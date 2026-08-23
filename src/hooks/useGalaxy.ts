import { useEffect, type RefObject } from 'react';
import { runAnimation, prefersReducedMotion, type Animation } from '../lib/motion';
import { loadPlate } from '../lib/plate';

// A single photoreal Milky-Way plate (generated face-on with Higgsfield,
// decoded to an additive sprite in loadPlate) spinning about its own axis.
// The face-on image is squashed and tilted by the canvas transform, so the
// disc reads as a plate seen at ~55 degrees, not an ellipse tumbling.
const TILT = -0.24; // screen-space rotation of the whole disc
const INCLINE = 0.55; // cos(inclination): 1 = face-on, 0 = edge-on
const ROT_SPEED = -0.035; // rad/s — one revolution in ~3 minutes
const PLATE_FILL = 0.425; // galaxy radius as a fraction of the plate size
const ALPHA = 0.82; // keep the hero copy readable over the disc
const FADE_IN = 1.4; // seconds

/**
 * Renders the Milky Way backdrop: a photorealistic face-on galaxy plate,
 * inclined like a spinning plate and rotating slowly about its own axis.
 */
export function useGalaxy(canvasRef: RefObject<HTMLCanvasElement>): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    let anim: Animation | null = null;

    let W = 0;
    let H = 0;
    let cx = 0;
    let cy = 0;
    let R = 0; // on-screen galaxy radius in device px

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.width = Math.floor(window.innerWidth * dpr);
      H = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      cx = W / 2;
      cy = H * 0.46;
      R = Math.max(W, H) * 0.58;
      anim?.redraw();
    };
    resize();

    let plate: HTMLCanvasElement | null = null;
    let plateAt = 0; // when the plate arrived, for the fade-in
    loadPlate('/space/galaxy.webp', 0.9)
      .then((p) => {
        plate = p;
        plateAt = performance.now();
        anim?.redraw();
      })
      .catch(() => {
        /* starfield layers still cover the backdrop */
      });

    let galRot = 0;
    let lastT = performance.now();

    const draw = (now: number) => {
      // `dt` is clamped so a tab resumed from the background doesn't jump the
      // disc forward by however long it was hidden.
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      galRot += dt * ROT_SPEED;

      ctx.clearRect(0, 0, W, H);
      if (plate) {
        const fade = reduced ? 1 : Math.min(1, (now - plateAt) / 1000 / FADE_IN);
        const size = R / PLATE_FILL;
        ctx.globalCompositeOperation = 'lighter';
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(TILT);
        ctx.scale(1, INCLINE);
        ctx.rotate(galRot);
        ctx.globalAlpha = ALPHA * fade;
        ctx.drawImage(plate, -size / 2, -size / 2, size, size);
        ctx.restore();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    };

    window.addEventListener('resize', resize);
    anim = runAnimation(draw);

    return () => {
      anim?.stop();
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef]);
}
