import { useEffect, type RefObject } from 'react';

// Milky Way geometry: a barred spiral seen at a gentle inclination.
// Arms follow a logarithmic spiral r = R0 * e^(PITCH * theta) with a ~13.5deg
// pitch angle (the measured value for the Milky Way); the two major arms
// (Scutum-Centaurus / Perseus analogues) spring from the ends of the central
// bar, with two fainter minor arms between them.
const PITCH = 0.24; // tan(pitch angle)
const R0 = 0.05; // radius (fraction of R) where the arms leave the bar
const INCL = 0.5; // disc inclination squash
const TILT = -0.3; // screen-space tilt of the disc
const BAR_ANGLE = 0.9; // bar orientation in disc space
const BAR_HALF = 0.16; // bar half-length as a fraction of R
const STAR_COUNT = 3400;

type RGB = [number, number, number];

interface Arm {
  off: number;
  major: boolean;
  w: number;
}

interface GalaxyStar {
  r: number;
  theta: number;
  z: number;
  col: string;
  size: number;
  a: number;
  tw: number;
  tws: number;
  fg: boolean;
}

interface Haze {
  r: number;
  theta: number;
  z: number;
  spr: HTMLCanvasElement;
  sizeFrac: number;
  a: number;
}

interface DustLane {
  r: number;
  theta: number;
  sizeFrac: number;
  stretch: number;
  a: number;
}

interface HIIRegion {
  r: number;
  theta: number;
  sizeFrac: number;
  a: number;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
/** Approximate gaussian in [-1, 1] via summed uniforms — concentrates points on the arms. */
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

/** Angle of the logarithmic spiral centerline of an arm at radius r. */
const armTheta = (r: number, off: number) => off + Math.log(Math.max(r, R0) / R0) / PITCH;

/**
 * Renders a slowly-rotating Milky-Way-like barred spiral galaxy: a warm
 * yellow-white bulge and bar, logarithmic spiral arms traced by blue young
 * stars and pink H-II star-forming regions, dark dust lanes hugging the inner
 * edges of the arms, and a smooth disc of older field stars. This is the
 * page's opening backdrop before the scroll pulls the viewer in.
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

    /** Disc coords (radius fraction, angle, vertical offset) -> screen px. */
    const project = (r: number, ang: number, z: number): [number, number] => {
      const ux = r * Math.cos(ang);
      const uy = r * Math.sin(ang) * INCL + z;
      return [cx + (ux * cosT - uy * sinT) * R, cy + (ux * sinT + uy * cosT) * R];
    };

    const arms: Arm[] = [
      { off: BAR_ANGLE, major: true, w: 1 },
      { off: BAR_ANGLE + Math.PI, major: true, w: 1 },
      { off: BAR_ANGLE + Math.PI * 0.5, major: false, w: 0.45 },
      { off: BAR_ANGLE + Math.PI * 1.5, major: false, w: 0.45 },
    ];
    let wSum = 0;
    const wAcc = arms.map((a) => (wSum += a.w));
    const pickArm = (): Arm => {
      const x = Math.random() * wSum;
      for (let k = 0; k < arms.length; k++) if (x <= wAcc[k]) return arms[k];
      return arms[0];
    };

    // --- Star populations ---------------------------------------------------
    const BULGE: RGB[] = [
      [255, 226, 180],
      [255, 238, 208],
      [255, 210, 160],
    ];
    const DISC: RGB[] = [
      [228, 233, 255],
      [255, 241, 214],
      [255, 234, 200],
    ];
    const YOUNG: RGB[] = [
      [160, 192, 255],
      [198, 217, 255],
      [235, 242, 255],
    ];
    const pick = (list: RGB[]) => list[(Math.random() * list.length) | 0].join(',');

    const pts: GalaxyStar[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const u = Math.random();
      let r: number;
      let theta: number;
      let z: number;
      let col: string;
      let size: number;
      let a: number;

      if (u < 0.14) {
        // Central bulge: a dense, slightly puffy spheroid of old warm stars.
        r = Math.pow(Math.random(), 2.1) * 0.17;
        theta = rnd(0, Math.PI * 2);
        z = gauss() * 0.05 * (1 - r * 2.5);
        col = Math.random() < 0.06 ? '255,180,140' : pick(BULGE);
        size = rnd(0.4, 1.15) * dpr;
        a = rnd(0.28, 0.62);
      } else if (u < 0.27) {
        // The bar: an elongated warm stellar lens the arms unwind from.
        const along = gauss() * BAR_HALF;
        const across = gauss() * BAR_HALF * 0.3;
        r = Math.hypot(along, across);
        theta = Math.atan2(across, along) + BAR_ANGLE;
        z = gauss() * 0.015;
        col = pick(BULGE);
        size = rnd(0.4, 1.2) * dpr;
        a = rnd(0.26, 0.6);
      } else {
        // Disc stars: exponential-ish radial falloff; most trace the arms,
        // a smooth inter-arm "field" population fills the space between.
        r = 0.07 + Math.pow(Math.random(), 1.3) * 0.98;
        const field = Math.random() < 0.26;
        const arm = pickArm();
        // Constant-ish physical arm width => angular width shrinks with r.
        const width = (0.055 + 0.06 / (r + 0.25)) * (arm.major ? 1 : 1.2);
        const spread = gauss() * width;
        theta = field ? rnd(0, Math.PI * 2) : armTheta(r, arm.off) + spread;
        z = gauss() * 0.014 * (1 - r * 0.5);
        const onRidge = !field && arm.major && Math.abs(spread) < width * 0.55;
        if (onRidge && r > 0.26 && Math.random() < 0.72) {
          col = pick(YOUNG); // hot young stars light up the arm ridges
        } else if (Math.random() < 0.05) {
          col = '255,185,145'; // scattered red giants
        } else {
          col = pick(DISC);
        }
        size = rnd(0.4, 1.5) * dpr * (onRidge ? 1.12 : 1);
        a = (field ? rnd(0.14, 0.45) : rnd(0.26, 0.85)) * (arm.major || field ? 1 : 0.6);
      }

      pts.push({
        r,
        theta,
        z,
        col,
        size,
        a,
        tw: Math.random() * Math.PI * 2,
        tws: rnd(0.6, 2.2),
        fg: Math.random() < 0.18, // drawn above the dust lanes
      });
    }

    // --- Sprites -------------------------------------------------------------
    const makeGlow = (stops: Array<[number, string]>): HTMLCanvasElement => {
      const s = document.createElement('canvas');
      s.width = s.height = 256;
      const sc = s.getContext('2d')!;
      const gd = sc.createRadialGradient(128, 128, 0, 128, 128, 128);
      for (const [p, c] of stops) gd.addColorStop(p, c);
      sc.fillStyle = gd;
      sc.fillRect(0, 0, 256, 256);
      return s;
    };

    const spCore = makeGlow([
      [0, 'rgba(255,246,224,0.95)'],
      [0.2, 'rgba(255,233,192,0.5)'],
      [0.5, 'rgba(255,216,164,0.16)'],
      [1, 'rgba(255,216,164,0)'],
    ]);
    const spBar = makeGlow([
      [0, 'rgba(255,230,185,0.7)'],
      [0.45, 'rgba(255,214,165,0.26)'],
      [1, 'rgba(255,214,165,0)'],
    ]);
    const spDisc = makeGlow([
      [0, 'rgba(158,182,242,0.16)'],
      [0.55, 'rgba(132,162,235,0.07)'],
      [1, 'rgba(132,162,235,0)'],
    ]);
    const spHazeBlue = makeGlow([
      [0, 'rgba(135,172,255,0.8)'],
      [0.45, 'rgba(135,172,255,0.22)'],
      [1, 'rgba(135,172,255,0)'],
    ]);
    const spHazeCyan = makeGlow([
      [0, 'rgba(120,205,230,0.75)'],
      [0.45, 'rgba(120,205,230,0.2)'],
      [1, 'rgba(120,205,230,0)'],
    ]);
    const spHazeWarm = makeGlow([
      [0, 'rgba(255,216,168,0.8)'],
      [0.45, 'rgba(255,216,168,0.22)'],
      [1, 'rgba(255,216,168,0)'],
    ]);
    const spHII = makeGlow([
      [0, 'rgba(255,196,208,0.95)'],
      [0.3, 'rgba(255,118,158,0.5)'],
      [0.7, 'rgba(230,70,120,0.14)'],
      [1, 'rgba(230,70,120,0)'],
    ]);
    const spDust = makeGlow([
      [0, 'rgba(10,6,10,0.9)'],
      [0.55, 'rgba(14,8,12,0.4)'],
      [1, 'rgba(14,8,12,0)'],
    ]);

    // --- Arm haze: unresolved starlight along the arms ----------------------
    const haze: Haze[] = [];
    for (let i = 0; i < 95; i++) {
      const arm = pickArm();
      const r = 0.08 + Math.pow(Math.random(), 1.1) * 0.9;
      const width = 0.04 + 0.05 / (r + 0.25);
      const theta = armTheta(r, arm.off) + gauss() * width;
      let spr: HTMLCanvasElement;
      if (r < 0.24) spr = spHazeWarm;
      else spr = Math.random() < 0.3 ? spHazeCyan : spHazeBlue;
      haze.push({
        r,
        theta,
        z: gauss() * 0.012,
        spr,
        sizeFrac: rnd(0.04, 0.115) * (arm.major ? 1 : 0.72),
        a: rnd(0.05, 0.13) * (arm.major ? 1 : 0.5),
      });
    }

    // --- Dust lanes: dark clouds hugging the inner (concave) edge of arms ---
    const dust: DustLane[] = [];
    for (let i = 0; i < 130; i++) {
      const arm = pickArm();
      if (!arm.major && Math.random() < 0.7) continue;
      const r = 0.15 + Math.pow(Math.random(), 1.1) * 0.78;
      const width = 0.05 + 0.05 / (r + 0.25);
      const theta = armTheta(r, arm.off) - width * (0.55 + Math.random() * 0.5) + gauss() * width * 0.25;
      dust.push({
        r,
        theta,
        sizeFrac: rnd(0.018, 0.05),
        stretch: rnd(2.2, 3.8),
        a: rnd(0.12, 0.26),
      });
    }
    // A few big, diffuse dark patches to break up the disc's smoothness.
    for (let i = 0; i < 9; i++) {
      const arm = arms[(Math.random() * 2) | 0];
      const r = rnd(0.25, 0.85);
      dust.push({
        r,
        theta: armTheta(r, arm.off) - rnd(0.02, 0.09),
        sizeFrac: rnd(0.07, 0.13),
        stretch: rnd(1.6, 2.4),
        a: rnd(0.06, 0.11),
      });
    }

    // --- H-II regions: pink star-forming knots strung along the major arms --
    const hii: HIIRegion[] = [];
    for (let i = 0; i < 46; i++) {
      const arm = arms[(Math.random() * 2) | 0];
      const r = rnd(0.24, 0.96);
      const width = 0.04 + 0.05 / (r + 0.25);
      hii.push({
        r,
        theta: armTheta(r, arm.off) + gauss() * width * 0.45,
        sizeFrac: rnd(0.008, 0.028),
        a: rnd(0.22, 0.5),
      });
    }

    // Moving outward along a log spiral advances theta by ln(r2/r1)/PITCH.
    const D_THETA = Math.log(1.05) / PITCH;

    let galRot = 0;
    let lastT = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      galRot -= dt * 0.05;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      // Smooth light: outer disc, bar and bulge, drawn in disc space so the
      // glows share the stars' inclination and tilt.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(TILT);
      ctx.scale(1, INCL);
      ctx.drawImage(spDisc, -R, -R, R * 2, R * 2);
      ctx.save();
      ctx.rotate(BAR_ANGLE + galRot);
      ctx.scale(1, 0.42);
      const bs = R * 0.3;
      ctx.drawImage(spBar, -bs, -bs, bs * 2, bs * 2);
      ctx.restore();
      ctx.restore();
      // The bulge is rounder than the disc, so it gets a gentler squash.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(TILT);
      ctx.scale(1, 0.74);
      const cs = R * 0.3;
      ctx.drawImage(spCore, -cs, -cs, cs * 2, cs * 2);
      ctx.restore();

      for (const c of haze) {
        const [X, Y] = project(c.r, c.theta + galRot, c.z);
        const sz = c.sizeFrac * R;
        ctx.globalAlpha = c.a;
        ctx.drawImage(c.spr, X - sz, Y - sz, sz * 2, sz * 2);
      }

      for (const p of pts) {
        if (p.fg) continue;
        const [X, Y] = project(p.r, p.theta + galRot, p.z);
        const tw = 0.75 + 0.25 * Math.sin(now * 0.001 * p.tws + p.tw);
        ctx.globalAlpha = p.a * tw;
        ctx.fillStyle = `rgb(${p.col})`;
        ctx.beginPath();
        ctx.arc(X, Y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dust lanes occlude, so they composite normally on top of the glow,
      // each stretched along the local arm tangent.
      ctx.globalCompositeOperation = 'source-over';
      for (const d of dust) {
        const ang = d.theta + galRot;
        const [X1, Y1] = project(d.r, ang, 0);
        const [X2, Y2] = project(d.r * 1.05, ang + D_THETA, 0);
        const phi = Math.atan2(Y2 - Y1, X2 - X1);
        const sz = d.sizeFrac * R;
        ctx.save();
        ctx.translate(X1, Y1);
        ctx.rotate(phi);
        ctx.globalAlpha = d.a;
        ctx.drawImage(spDust, -sz * d.stretch, -sz, sz * d.stretch * 2, sz * 2);
        ctx.restore();
      }

      // Star-forming regions and a layer of foreground stars sit above the dust.
      ctx.globalCompositeOperation = 'lighter';
      for (const h of hii) {
        const [X, Y] = project(h.r, h.theta + galRot, 0);
        const sz = h.sizeFrac * R;
        ctx.globalAlpha = h.a;
        ctx.drawImage(spHII, X - sz, Y - sz, sz * 2, sz * 2);
      }
      for (const p of pts) {
        if (!p.fg) continue;
        const [X, Y] = project(p.r, p.theta + galRot, p.z);
        const tw = 0.75 + 0.25 * Math.sin(now * 0.001 * p.tws + p.tw);
        ctx.globalAlpha = p.a * tw;
        ctx.fillStyle = `rgb(${p.col})`;
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
