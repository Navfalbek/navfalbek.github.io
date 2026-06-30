import { useEffect, type RefObject } from 'react';

// Spiral geometry constants (radians / unitless).
// Higher TWIST = more tightly wound, more visibly spiral arms.
const TWIST = 6.4;
const INCL = 0.42;
const TILT = -0.32;
const STAR_COUNT = Math.round(520 * 4.4);
const CLOUD_COUNT = 115;

type RGB = [number, number, number];

interface Arm {
  off: number;
  main: boolean;
  w: number;
}

interface GalaxyStar {
  r: number;
  theta: number;
  z: number;
  col: RGB;
  size: number;
  a: number;
  tw: number;
  tws: number;
}

interface Cloud {
  r: number;
  theta: number;
  spr: HTMLCanvasElement;
  z: number;
  sizeFrac: number;
  a: number;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
/** Approximate gaussian in [-1, 1] via summed uniforms — concentrates points on the arms. */
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

/**
 * Renders a slowly-rotating, top-down spiral galaxy: a bright bulge, two main
 * arms plus faint feathering arms, drifting nebula clouds, and twinkling stars.
 * This is the page's opening backdrop before the scroll pulls the viewer in.
 */
export function useGalaxy(canvasRef: RefObject<HTMLCanvasElement>): void {
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
    let R = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.width = Math.floor(window.innerWidth * dpr);
      H = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      cx = W / 2;
      cy = H * 0.46;
      R = Math.max(W, H) * 0.62;
    };
    resize();

    const cosT = Math.cos(TILT);
    const sinT = Math.sin(TILT);

    const arms: Arm[] = [
      // Four bright main tails, evenly spaced around the disc.
      { off: 0, main: true, w: 1.15 },
      { off: Math.PI * 0.5, main: true, w: 1.15 },
      { off: Math.PI, main: true, w: 1.15 },
      { off: Math.PI * 1.5, main: true, w: 1.15 },
      // Faint feathering arms woven between the main tails.
      { off: Math.PI * 0.22, main: false, w: 0.16 },
      { off: Math.PI * 0.34, main: false, w: 0.16 },
      { off: Math.PI * 0.66, main: false, w: 0.16 },
      { off: Math.PI * 0.84, main: false, w: 0.16 },
      { off: Math.PI * 1.02, main: false, w: 0.16 },
      { off: Math.PI * 1.22, main: false, w: 0.16 },
      { off: Math.PI * 1.34, main: false, w: 0.16 },
      { off: Math.PI * 1.68, main: false, w: 0.16 },
      { off: Math.PI * 1.84, main: false, w: 0.16 },
    ];
    let wSum = 0;
    const wAcc = arms.map((a) => (wSum += a.w));
    const pickArm = (): Arm => {
      const x = Math.random() * wSum;
      for (let k = 0; k < arms.length; k++) if (x <= wAcc[k]) return arms[k];
      return arms[0];
    };

    const pts: GalaxyStar[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const halo = Math.random() < 0.1;
      let r = halo ? Math.pow(Math.random(), 0.6) : Math.pow(Math.random(), 1.35);
      const arm = pickArm();
      if (!arm.main && !halo) r = 0.16 + r * 0.78;
      const width = (arm.main ? 0.16 : 0.12) + 0.14 * (1 - r);
      const spread = halo ? rnd(-Math.PI, Math.PI) : gauss() * width;
      const theta = arm.off + r * TWIST + spread;
      let col: RGB;
      if (r < 0.16) {
        col = [255, 245, 226];
      } else {
        const t = Math.random();
        col = t < 0.08 ? [255, 150, 190] : t < 0.14 ? [255, 196, 140] : [180, 212, 255];
      }
      const dim = arm.main ? 1 : 0.5;
      pts.push({
        r,
        theta,
        z: gauss() * 0.02 * (1 - r) + (halo ? gauss() * 0.05 : 0),
        col,
        size:
          (r < 0.2 ? rnd(0.5, 1.3) * (0.6 + 0.7 * (1 - r / 0.2)) : rnd(0.4, 1.5)) *
          dpr *
          (arm.main ? 1 : 0.82),
        a:
          (r < 0.2 ? (0.24 + 0.36 * (1 - r / 0.2)) * rnd(0.8, 1.05) : rnd(0.25, 0.85)) *
          (halo ? 0.5 : 1) *
          dim,
        tw: Math.random() * Math.PI * 2,
        tws: rnd(0.6, 2.2),
      });
    }

    const makeSprite = (r: number, g: number, b: number): HTMLCanvasElement => {
      const s = document.createElement('canvas');
      s.width = s.height = 128;
      const sc = s.getContext('2d')!;
      const gd = sc.createRadialGradient(64, 64, 0, 64, 64, 64);
      gd.addColorStop(0, `rgba(${r},${g},${b},0.85)`);
      gd.addColorStop(0.45, `rgba(${r},${g},${b},0.20)`);
      gd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      sc.fillStyle = gd;
      sc.fillRect(0, 0, 128, 128);
      return s;
    };
    const spBlue = makeSprite(110, 160, 255);
    const spTeal = makeSprite(80, 200, 225);
    const spPink = makeSprite(255, 140, 200);
    const spWarm = makeSprite(255, 200, 150);

    const clouds: Cloud[] = [];
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const arm = pickArm();
      let r = Math.pow(Math.random(), 1.1);
      if (!arm.main) r = 0.16 + r * 0.78;
      const width = (arm.main ? 0.13 : 0.1) + 0.12 * (1 - r);
      const theta = arm.off + r * TWIST + gauss() * width;
      let spr: HTMLCanvasElement;
      let baseA: number;
      if (r < 0.2) {
        spr = spWarm;
        baseA = 0.18;
      } else {
        const t = Math.random();
        if (t < 0.16) {
          spr = spPink;
          baseA = 0.13;
        } else if (t < 0.5) {
          spr = spTeal;
          baseA = 0.11;
        } else {
          spr = spBlue;
          baseA = 0.12;
        }
      }
      clouds.push({
        r,
        theta,
        spr,
        z: gauss() * 0.02 * (1 - r),
        sizeFrac: rnd(0.05, 0.13) * (arm.main ? 1.1 : 0.78),
        a: baseA * rnd(0.6, 1.1) * (arm.main ? 1 : 0.45),
      });
    }

    let galRot = 0;
    let lastT = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      galRot -= dt * 0.06;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      const coreR = R * 0.32;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      cg.addColorStop(0, 'rgba(255,251,245,0.55)');
      cg.addColorStop(0.12, 'rgba(253,243,224,0.325)');
      cg.addColorStop(0.3, 'rgba(250,231,198,0.163)');
      cg.addColorStop(0.58, 'rgba(247,221,180,0.055)');
      cg.addColorStop(1, 'rgba(247,221,180,0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      const dg = ctx.createRadialGradient(cx, cy, coreR * 0.5, cx, cy, R * 0.95);
      dg.addColorStop(0, 'rgba(150,180,255,0.05)');
      dg.addColorStop(0.6, 'rgba(120,160,255,0.03)');
      dg.addColorStop(1, 'rgba(120,160,255,0)');
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      for (const c of clouds) {
        const ang = c.theta + galRot;
        const ux = c.r * Math.cos(ang);
        const uy = c.r * Math.sin(ang) * INCL + c.z;
        const X = cx + (ux * cosT - uy * sinT) * R;
        const Y = cy + (ux * sinT + uy * cosT) * R;
        const sz = c.sizeFrac * R;
        ctx.globalAlpha = c.a;
        ctx.drawImage(c.spr, X - sz, Y - sz, sz * 2, sz * 2);
      }

      for (const p of pts) {
        const ang = p.theta + galRot;
        const ux = p.r * Math.cos(ang);
        const uy = p.r * Math.sin(ang) * INCL + p.z;
        const X = cx + (ux * cosT - uy * sinT) * R;
        const Y = cy + (ux * sinT + uy * cosT) * R;
        const tw = 0.75 + 0.25 * Math.sin(now * 0.001 * p.tws + p.tw);
        ctx.globalAlpha = p.a * tw;
        ctx.fillStyle = `rgb(${p.col[0]},${p.col[1]},${p.col[2]})`;
        ctx.beginPath();
        ctx.arc(X, Y, p.size, 0, Math.PI * 2);
        ctx.fill();
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
