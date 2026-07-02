import { useEffect, type RefObject } from 'react';

type RGB = [number, number, number];

interface NebulaDef {
  outer: RGB; // faint envelope color
  inner: RGB; // bright emission color
  highlight: RGB; // hottest knots
  dust: number; // strength of dark dust filaments (0..1)
  seed: number;
  x: number; // position as viewport fraction
  y: number;
  size: number; // diameter as fraction of max(vw, vh)
  alpha: number;
  speed: number; // drift speed
  phase: number;
  rotSpeed: number; // rad/s, very slow
}

// Palettes modelled on real emission/reflection nebulae: H-alpha red-pink,
// OIII teal, a dusty violet reflection cloud and a warm Carina-like cloud.
const NEBULAE: NebulaDef[] = [
  {
    outer: [8, 55, 78],
    inner: [86, 205, 218],
    highlight: [222, 255, 250],
    dust: 0.5,
    seed: 101,
    x: 0.16,
    y: 0.14,
    size: 0.95,
    alpha: 1,
    speed: 0.05,
    phase: 0.7,
    rotSpeed: 0.003,
  },
  {
    outer: [44, 24, 92],
    inner: [152, 122, 255],
    highlight: [236, 226, 255],
    dust: 0.55,
    seed: 202,
    x: 0.88,
    y: 0.42,
    size: 1.05,
    alpha: 1,
    speed: 0.04,
    phase: 2.3,
    rotSpeed: -0.0024,
  },
  {
    outer: [82, 14, 44],
    inner: [255, 112, 140],
    highlight: [255, 226, 216],
    dust: 0.7,
    seed: 303,
    x: 0.28,
    y: 0.92,
    size: 1.1,
    alpha: 0.95,
    speed: 0.035,
    phase: 4.1,
    rotSpeed: 0.002,
  },
  {
    outer: [70, 36, 18],
    inner: [255, 176, 108],
    highlight: [255, 238, 205],
    dust: 0.65,
    seed: 404,
    x: 0.58,
    y: 0.56,
    size: 0.75,
    alpha: 0.65,
    speed: 0.055,
    phase: 5.6,
    rotSpeed: -0.003,
  },
];

const SPRITE_SIZE = 320;

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Seeded 2D value noise with smooth (hermite) interpolation. */
function makeNoise(rng: () => number) {
  const vals = new Float32Array(256);
  const perm = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    vals[i] = rng();
    perm[i] = i;
  }
  for (let i = 255; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    const t = perm[i];
    perm[i] = perm[j];
    perm[j] = t;
  }
  const at = (xi: number, yi: number) => vals[perm[(xi + perm[yi & 255]) & 255]];
  return (x: number, y: number): number => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = x - xi;
    const fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * sx;
    const b = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * sx;
    return a + (b - a) * sy;
  };
}

/** 4-octave fractal brownian motion, normalized to roughly [0, 1]. */
function makeFbm(noise: (x: number, y: number) => number) {
  return (x: number, y: number): number => {
    let sum = 0;
    let amp = 0.5;
    let f = 1;
    for (let o = 0; o < 4; o++) {
      sum += noise(x * f, y * f) * amp;
      f *= 2;
      amp *= 0.55;
    }
    return sum / 0.98; // 0.5 + 0.275 + 0.151 + 0.083
  };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Bakes one nebula into an offscreen canvas: domain-warped fbm noise gives
 * the wispy cloud structure, a second noise channel carves dark dust
 * filaments, the color ramps from a faint envelope through the emission
 * color to near-white knots, and a scatter of stars is embedded on top.
 */
function bakeNebula(def: NebulaDef): HTMLCanvasElement {
  const N = SPRITE_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = N;
  const ctx = canvas.getContext('2d')!;
  const rng = makeRng(def.seed);
  const fbm = makeFbm(makeNoise(rng));

  const img = ctx.createImageData(N, N);
  const data = img.data;
  const scale = 4 / N; // ~4 noise cells across the sprite

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const nx = (x / N) * 2 - 1;
      const ny = (y / N) * 2 - 1;
      const d = Math.hypot(nx, ny);
      // Irregular radial envelope so the cloud has no hard circular edge.
      const env = Math.pow(clamp01((1 - d) / 0.72), 1.6);
      if (env <= 0.003) continue;

      const sx = x * scale;
      const sy = y * scale;
      // Domain warping bends the noise into filaments and wisps.
      const wx = sx + (fbm(sx + 5.2, sy + 1.3) - 0.5) * 2.4;
      const wy = sy + (fbm(sx + 9.7, sy + 8.1) - 0.5) * 2.4;
      const n = fbm(wx * 1.6, wy * 1.6);

      const t = clamp01((n - 0.3) / 0.55) * env;
      if (t <= 0.004) continue;

      // Dark dust filaments eating into the bright gas.
      const dustN = fbm(wx * 3.1 + 17, wy * 3.1 + 7);
      const dk = 1 - def.dust * clamp01((dustN - 0.52) * 3.2) * 0.85;

      let cr = def.outer[0] + (def.inner[0] - def.outer[0]) * t;
      let cg = def.outer[1] + (def.inner[1] - def.outer[1]) * t;
      let cb = def.outer[2] + (def.inner[2] - def.outer[2]) * t;
      if (t > 0.72) {
        const h = ((t - 0.72) / 0.28) * 0.75;
        cr += (def.highlight[0] - cr) * h;
        cg += (def.highlight[1] - cg) * h;
        cb += (def.highlight[2] - cb) * h;
      }

      const i = (y * N + x) * 4;
      data[i] = cr * dk;
      data[i + 1] = cg * dk;
      data[i + 2] = cb * dk;
      data[i + 3] = Math.pow(t, 1.1) * dk * 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Bloom pass: re-composite a blurred copy additively so the bright
  // emission cores glow the way long-exposure nebula photos do.
  ctx.globalCompositeOperation = 'lighter';
  ctx.filter = 'blur(7px)';
  ctx.globalAlpha = 0.75;
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = 'none';
  ctx.globalAlpha = 1;

  // Embedded stars: a sparse cluster, brightest toward the middle.
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 130; i++) {
    const a = rng() * Math.PI * 2;
    const rr = Math.pow(rng(), 1.4) * 0.46 * N;
    const px = N / 2 + Math.cos(a) * rr;
    const py = N / 2 + Math.sin(a) * rr * 0.9;
    const bright = rng();
    const sz = 0.4 + bright * 1.1;
    ctx.globalAlpha = 0.25 + bright * 0.6;
    ctx.fillStyle = bright > 0.75 ? 'rgb(255,250,240)' : 'rgb(205,220,255)';
    ctx.beginPath();
    ctx.arc(px, py, sz, 0, Math.PI * 2);
    ctx.fill();
    if (bright > 0.9) {
      // Halo around the handful of brightest stars.
      const g = ctx.createRadialGradient(px, py, 0, px, py, sz * 7);
      g.addColorStop(0, 'rgba(255,250,240,0.35)');
      g.addColorStop(1, 'rgba(255,250,240,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, sz * 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

/**
 * Full-viewport canvas of procedurally generated nebulae. Each cloud is baked
 * once at startup, then drifts and rotates almost imperceptibly. The wrapper
 * layer's opacity/scale is driven by `useScrollScene`, so the clouds bloom
 * into view as the user scrolls into the galaxy.
 */
export function useNebula(canvasRef: RefObject<HTMLCanvasElement>): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sprites = NEBULAE.map(bakeNebula);

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
      for (let i = 0; i < NEBULAE.length; i++) {
        const n = NEBULAE[i];
        const px = n.x * W + Math.sin(t * n.speed + n.phase) * W * 0.018;
        const py = n.y * H + Math.cos(t * n.speed * 0.8 + n.phase) * H * 0.018;
        const s = n.size * base * (1 + 0.025 * Math.sin(t * n.speed * 0.6 + n.phase * 2));
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(t * n.rotSpeed + n.phase);
        ctx.globalAlpha = n.alpha;
        ctx.drawImage(sprites[i], -s / 2, -s / 2, s, s);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef]);
}
