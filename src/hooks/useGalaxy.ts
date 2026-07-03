import { useEffect, type RefObject } from 'react';

// ---------------------------------------------------------------------------
// A Milky-Way-like barred spiral (SBbc) seen at a gentle inclination.
//
// Geometry: two major arms (Scutum-Centaurus / Perseus analogues) spring from
// the tips of the central bar and wind outward as logarithmic spirals
// r = R_BAR * e^(PITCH * (theta - off)) with a ~14 deg pitch angle, close to
// the measured Milky Way value. Two fainter arms (Sagittarius / Norma
// analogues) and a short Local-Spur-like segment run between them, and a
// faint molecular ring circles the bar.
//
// Rendering: all the smooth structure — disc glow, bulge, bar, clumpy arm
// haze with spurs, dark dust lanes (inner arm edges + the classic straight
// bar lanes), pink H-II regions and blue OB associations — is baked once at
// startup into an offscreen face-on texture from ~20k tiny additive
// particles, then projected (rotated, inclined, tilted) each frame. Only the
// resolved stars twinkle live on top, so per-frame cost stays low.
// ---------------------------------------------------------------------------

const PITCH = 0.33; // tan(pitch angle) ~ 18deg — slightly open for readability
const R_BAR = 0.16; // bar half-length; the major arms start at the bar tips
const INCL = 0.5; // disc inclination squash
const TILT = -0.3; // screen-space tilt of the disc
const BAR_ANGLE = 0.9; // bar orientation in disc space
const EDGE = 1.07; // disc radius (in r units) mapped to the texture edge
const ROT_SPEED = 0.02; // pattern rotation in rad/s; arms trail the spin
const STAR_COUNT = 2400; // live resolved stars
const TAU = Math.PI * 2;

type RGB = [number, number, number];

interface Arm {
  off: number; // spiral phase: the angle the arm holds at r = R_BAR
  r0: number; // radius where the arm starts
  r1: number; // radius where the arm fades out
  lum: number; // relative brightness
  major: boolean;
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
}

interface HeroStar {
  r: number;
  theta: number;
  z: number;
  spr: HTMLCanvasElement;
  col: string;
  core: number;
  glow: number;
  a: number;
  tw: number;
  tws: number;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
/** Approximate gaussian in [-1, 1] via summed uniforms — concentrates points on the arms. */
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
const smooth01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** Angle of the logarithmic spiral centerline of an arm at radius r. */
const armTheta = (r: number, off: number) => off + Math.log(Math.max(r, R_BAR) / R_BAR) / PITCH;

/** Physical half-width of an arm (grows gently with radius). */
const armWidth = (r: number, major: boolean) => (0.07 + 0.05 * r) * (major ? 1 : 0.72);

const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const makeSprite = (stops: Array<[number, string]>, size = 64): HTMLCanvasElement => {
  const s = document.createElement('canvas');
  s.width = s.height = size;
  const sc = s.getContext('2d')!;
  const half = size / 2;
  const gd = sc.createRadialGradient(half, half, 0, half, half, half);
  for (const [p, c] of stops) gd.addColorStop(p, c);
  sc.fillStyle = gd;
  sc.fillRect(0, 0, size, size);
  return s;
};

/** Soft round particle used to accumulate smooth galaxy light. */
const softDot = (c: RGB) =>
  makeSprite([
    [0, rgba(c, 0.85)],
    [0.32, rgba(c, 0.34)],
    [0.62, rgba(c, 0.1)],
    [1, rgba(c, 0)],
  ]);

/**
 * Renders a slowly-rotating, photo-real Milky-Way-like barred spiral: a
 * blazing white-yellow core and bar, blue clumpy spiral arms threaded by dark
 * dust lanes and dotted with pink star-forming regions, all fading into a
 * faint stellar halo. This is the page's opening backdrop before the scroll
 * pulls the viewer in.
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

    const ARMS: Arm[] = [
      { off: BAR_ANGLE, r0: R_BAR * 0.98, r1: 1.04, lum: 1, major: true },
      { off: BAR_ANGLE + Math.PI * 1.02, r0: R_BAR * 0.98, r1: 0.97, lum: 0.9, major: true },
      { off: BAR_ANGLE + Math.PI * 0.55, r0: 0.24, r1: 0.88, lum: 0.5, major: false },
      { off: BAR_ANGLE + Math.PI * 1.52, r0: 0.26, r1: 0.92, lum: 0.46, major: false },
      // A short Local-Spur-like segment between the two majors.
      { off: BAR_ANGLE + 2.5, r0: 0.5, r1: 0.74, lum: 0.34, major: false },
    ];
    // Per-arm phases for the brightness clumping and dust-gap noise.
    const seeds = ARMS.map(() => [rnd(0, TAU), rnd(0, TAU), rnd(0, TAU)]);
    const clumpAt = (i: number, x: number) =>
      clamp(
        0.6 +
          0.5 * Math.sin(x * 2.1 + seeds[i][0]) * Math.sin(x * 3.7 + seeds[i][1]) +
          0.22 * Math.sin(x * 8.3 + seeds[i][2]),
        0.15,
        1.25,
      );

    // --- Bake the smooth galaxy into a face-on texture -----------------------
    const buildTexture = (): HTMLCanvasElement => {
      const TEX = clamp(Math.ceil((R * 2.15) / 128) * 128, 1024, 2560);
      const tex = document.createElement('canvas');
      tex.width = tex.height = TEX;
      const g = tex.getContext('2d')!;
      const S = TEX / 2;
      const scale = S / EDGE; // texture px per unit of galaxy radius

      const P = (r: number, th: number): [number, number] => [
        S + Math.cos(th) * r * scale,
        S + Math.sin(th) * r * scale,
      ];

      // Star-light particle sprites.
      const sprArm = softDot([140, 176, 255]); // hot young stars
      const sprIce = softDot([202, 216, 252]); // blue-white blend
      const sprCyan = softDot([152, 212, 235]);
      const sprWarm = softDot([255, 224, 182]); // old disc population
      const sprAmber = softDot([255, 206, 148]);
      const sprHII = makeSprite([
        [0, 'rgba(255,190,205,0.9)'],
        [0.28, 'rgba(255,110,150,0.45)'],
        [0.65, 'rgba(225,60,110,0.12)'],
        [1, 'rgba(225,60,110,0)'],
      ]);
      const sprHIICore = makeSprite([
        [0, 'rgba(255,235,240,0.95)'],
        [0.5, 'rgba(255,160,185,0.3)'],
        [1, 'rgba(255,160,185,0)'],
      ]);
      const sprDust = makeSprite([
        [0, 'rgba(9,5,4,0.9)'],
        [0.5, 'rgba(12,7,5,0.38)'],
        [1, 'rgba(12,7,5,0)'],
      ]);

      const put = (spr: HTMLCanvasElement, r: number, th: number, size: number, alpha: number) => {
        const [x, y] = P(r, th);
        const s = size * scale;
        g.globalAlpha = clamp(alpha, 0, 1);
        g.drawImage(spr, x - s, y - s, s * 2, s * 2);
      };
      /** Particle stretched to (along x across) galaxy units, rotated to angle phi. */
      const putStreak = (
        spr: HTMLCanvasElement,
        r: number,
        th: number,
        phi: number,
        along: number,
        across: number,
        alpha: number,
      ) => {
        const [x, y] = P(r, th);
        g.save();
        g.translate(x, y);
        g.rotate(phi);
        g.globalAlpha = clamp(alpha, 0, 1);
        g.drawImage(spr, -along * scale, -across * scale, along * 2 * scale, across * 2 * scale);
        g.restore();
      };
      /** Texture-space direction of the arm at radius r (for streaks / dust). */
      const tangentAt = (r: number, off: number): number => {
        const [x1, y1] = P(r, armTheta(r, off));
        const [x2, y2] = P(r * 1.03, armTheta(r * 1.03, off));
        return Math.atan2(y2 - y1, x2 - x1);
      };
      /** Elliptical radial glow aligned with the bar (squash 1 = circular). */
      const ell = (radius: number, squash: number, stops: Array<[number, string]>) => {
        g.save();
        g.translate(S, S);
        g.rotate(BAR_ANGLE);
        g.scale(1, squash);
        const rad = radius * scale;
        const gd = g.createRadialGradient(0, 0, 0, 0, 0, rad);
        for (const [p, c] of stops) gd.addColorStop(p, c);
        g.fillStyle = gd;
        g.fillRect(-rad, -rad / squash, rad * 2, (rad * 2) / squash);
        g.restore();
      };

      g.globalCompositeOperation = 'lighter';

      // 1. Smooth base light: cool outer disc + warm inner disc.
      ell(1.04, 1, [
        [0, 'rgba(102,120,172,0.24)'],
        [0.45, 'rgba(92,110,162,0.12)'],
        [0.75, 'rgba(72,90,145,0.05)'],
        [1, 'rgba(60,76,130,0)'],
      ]);
      ell(0.62, 1, [
        [0, 'rgba(255,224,180,0.3)'],
        [0.5, 'rgba(235,208,180,0.1)'],
        [1, 'rgba(235,208,180,0)'],
      ]);

      // 2. Unresolved field stars: smooth grain across the whole disc.
      const sprinkleField = (count: number, aScale: number) => {
        for (let i = 0; i < count; i++) {
          const r = Math.pow(Math.random(), 1.5) * 1.03;
          const th = rnd(0, TAU);
          const warm = Math.random() < clamp(0.72 - r * 0.55, 0.15, 0.75);
          const spr = warm
            ? Math.random() < 0.3
              ? sprAmber
              : sprWarm
            : Math.random() < 0.3
              ? sprArm
              : sprIce;
          put(spr, r, th, rnd(0.003, 0.009), rnd(0.04, 0.11) * (1.15 - r * 0.6) * aScale);
        }
      };
      sprinkleField(9000, 1);

      // 3. Spiral arms: dense haze with a bright blue ridge, clumpy along
      // their length, warmer toward the centre, fading at the tips.
      ARMS.forEach((A, i) => {
        const n = A.major ? 9 : 5;
        for (let r = A.r0; r < A.r1; r += 0.0035) {
          const t = (r - A.r0) / (A.r1 - A.r0);
          const th0 = armTheta(r, A.off);
          const env = smooth01(t / 0.1) * (1 - smooth01((t - 0.72) / 0.28) * 0.75);
          const cl = clumpAt(i, th0);
          const wAng = armWidth(r, A.major) / Math.max(r, 0.12);
          for (let k = 0; k < n; k++) {
            const sp = gauss();
            const th = th0 + sp * wAng;
            const rr = r + gauss() * 0.01;
            const ridge = 1 - Math.min(1, Math.abs(sp) * 1.5);
            const roll = Math.random();
            const spr =
              rr < 0.3 && roll < 0.45
                ? sprWarm
                : roll < 0.12
                  ? sprCyan
                  : roll < 0.5 + ridge * 0.3
                    ? sprArm
                    : sprIce;
            const size = rnd(0.012, 0.032) * (1.3 - ridge * 0.4);
            put(spr, rr, th, size, (0.04 + 0.07 * ridge) * env * cl * A.lum);
          }
        }
      });

      // Ridge streaks: elongated wisps along the arm direction so the arms
      // read as flowing streams instead of dotted trails.
      ARMS.forEach((A, i) => {
        if (!A.major) return;
        for (let r = A.r0 + 0.02; r < A.r1 - 0.02; r += 0.009) {
          const t = (r - A.r0) / (A.r1 - A.r0);
          const cl = clumpAt(i, armTheta(r, A.off));
          const wAng = armWidth(r, true) / Math.max(r, 0.12);
          const th = armTheta(r, A.off) + gauss() * wAng * 0.3;
          putStreak(
            Math.random() < 0.6 ? sprArm : sprIce,
            r,
            th,
            tangentAt(r, A.off),
            rnd(0.025, 0.055),
            rnd(0.012, 0.02),
            0.07 * cl * A.lum * (1 - t * 0.5),
          );
        }
      });

      // 4. Spurs / feathers of young stars branching off the major arms.
      for (let i = 0; i < 22; i++) {
        const A = ARMS[(Math.random() * 2) | 0];
        const rA = rnd(0.22, 0.78);
        const thA = armTheta(rA, A.off) + ((gauss() * armWidth(rA, true)) / rA) * 0.4;
        const len = rnd(0.06, 0.16);
        const dir = Math.random() < 0.72 ? 1 : -1;
        const p2 = PITCH * rnd(1.7, 2.8); // spurs open faster than the arm
        for (let s = 0; s < 26; s++) {
          const f = s / 26;
          const r = rA + dir * len * f;
          if (r < 0.1 || r > 1.03) break;
          const th = thA + Math.log(r / rA) / p2 + gauss() * 0.015;
          put(Math.random() < 0.5 ? sprArm : sprIce, r, th, rnd(0.004, 0.01), 0.035 * (1 - f) * A.lum);
        }
      }

      // 5. Molecular ring around the bar (the Milky Way's "5 kpc ring").
      for (let i = 0; i < 260; i++) {
        const r = R_BAR * 1.12 + gauss() * 0.018;
        const th = rnd(0, TAU);
        put(Math.random() < 0.5 ? sprWarm : sprArm, r, th, rnd(0.004, 0.01), rnd(0.02, 0.05));
      }

      // 6. The bar: an elongated warm stellar lens the arms unwind from.
      ell(R_BAR * 1.75, 0.36, [
        [0, 'rgba(255,222,175,0.4)'],
        [0.5, 'rgba(255,210,160,0.14)'],
        [1, 'rgba(255,210,160,0)'],
      ]);
      for (let i = 0; i < 1100; i++) {
        const along = gauss() * R_BAR * 0.92;
        const across = gauss() * 0.042 * (1 - (0.5 * Math.abs(along)) / R_BAR);
        const r = Math.hypot(along, across);
        const th = Math.atan2(across, along) + BAR_ANGLE;
        put(Math.random() < 0.35 ? sprAmber : sprWarm, r, th, rnd(0.003, 0.009), rnd(0.04, 0.1));
      }

      // 7. Bulge: a boxy warm spheroid saturating to white at the very core.
      ell(0.38, 0.8, [
        [0, 'rgba(255,232,196,0.6)'],
        [0.35, 'rgba(255,214,166,0.25)'],
        [1, 'rgba(255,214,166,0)'],
      ]);
      ell(0.17, 0.86, [
        [0, 'rgba(255,248,232,0.9)'],
        [0.4, 'rgba(255,228,190,0.42)'],
        [1, 'rgba(255,228,190,0)'],
      ]);
      ell(0.07, 0.9, [
        [0, 'rgba(255,255,252,1)'],
        [0.5, 'rgba(255,242,218,0.5)'],
        [1, 'rgba(255,242,218,0)'],
      ]);
      for (let i = 0; i < 800; i++) {
        const along = gauss() * 0.115;
        const across = gauss() * 0.085;
        const r = Math.hypot(along, across);
        const th = Math.atan2(across, along) + BAR_ANGLE;
        put(Math.random() < 0.3 ? sprAmber : sprWarm, r, th, rnd(0.002, 0.006), rnd(0.05, 0.12));
      }

      // 8. H-II regions (pink star nurseries) and blue OB associations strung
      // along the arm ridges, on the outer (downstream) side of the dust.
      for (let i = 0; i < 58; i++) {
        const A = ARMS[Math.random() < 0.78 ? (Math.random() * 2) | 0 : 2 + ((Math.random() * 2) | 0)];
        const r = rnd(Math.max(A.r0 + 0.04, 0.2), A.r1 - 0.04);
        const wAng = armWidth(r, A.major) / Math.max(r, 0.12);
        const th = armTheta(r, A.off) - wAng * 0.15 + gauss() * wAng * 0.3;
        const size = rnd(0.007, 0.022);
        put(sprHII, r, th, size, rnd(0.22, 0.48) * A.lum);
        if (size > 0.013) put(sprHIICore, r, th, size * 0.34, 0.5);
      }
      for (let i = 0; i < 44; i++) {
        const A = ARMS[(Math.random() * 2) | 0];
        const r = rnd(0.2, A.r1 - 0.04);
        const wAng = armWidth(r, true) / Math.max(r, 0.12);
        const th = armTheta(r, A.off) + gauss() * wAng * 0.32;
        put(sprArm, r, th, rnd(0.004, 0.009), rnd(0.3, 0.55));
        put(sprIce, r, th, rnd(0.0015, 0.003), 0.7);
      }

      // 9. Dust. 'source-atop' only darkens existing light, so the lanes eat
      // into the glow without smudging the empty sky around the disc.
      g.globalCompositeOperation = 'source-atop';

      // Winding lanes hugging the inner (concave) edge of each arm.
      ARMS.forEach((A, i) => {
        if (!A.major && A.lum < 0.4) return; // the spur segment gets no lane
        const strength = A.major ? 1 : 0.45;
        const d1 = seeds[i][0];
        const d2 = seeds[i][1];
        for (let r = Math.max(A.r0 + 0.01, 0.17); r < Math.min(A.r1, 0.94); r += 0.004) {
          const th0 = armTheta(r, A.off);
          const gap = 0.62 + 0.5 * Math.sin(th0 * 3.1 + d1) * Math.sin(th0 * 6.7 + d2);
          if (gap < 0.22) continue; // patchy, broken lanes
          const wAng = armWidth(r, A.major) / Math.max(r, 0.12);
          const wig = 0.3 * Math.sin(r * 34 + d1) + 0.18 * Math.sin(r * 77 + d2);
          const th = th0 + wAng * (0.42 + 0.25 * wig);
          const fade = r < 0.72 ? 1 : 1 - (r - 0.72) / 0.22;
          const across = rnd(0.009, 0.018) * (1.15 - 0.4 * r);
          const phi = tangentAt(r, A.off);
          putStreak(
            sprDust,
            r + gauss() * 0.004,
            th,
            phi,
            across * rnd(2.4, 3.8),
            across,
            rnd(0.25, 0.45) * fade * strength * Math.min(1, gap),
          );
          if (Math.random() < 0.3) {
            // a second, fainter thread further into the arm
            putStreak(sprDust, r, th0 + wAng * rnd(0, 0.3), phi, across * 2, across * 0.7, 0.12 * fade * strength);
          }
        }
      });

      // Dust feathers cutting across the arms toward their outer edges.
      for (let i = 0; i < 34; i++) {
        const A = ARMS[i % 2];
        let r = rnd(0.22, 0.8);
        const wAng0 = armWidth(r, true) / r;
        let th = armTheta(r, A.off) + wAng0 * 0.5;
        const steps = 8 + ((Math.random() * 8) | 0);
        const drs = rnd(0.004, 0.009);
        for (let s = 0; s < steps; s++) {
          const f = s / steps;
          putStreak(
            sprDust,
            r,
            th,
            tangentAt(r, A.off) + rnd(-0.3, 0.3),
            0.008,
            0.0035,
            0.16 * (1 - f * 0.7),
          );
          r += drs;
          th += Math.log(r / (r - drs)) / PITCH - (wAng0 * 1.5) / steps;
        }
      }

      // The classic straight bar lanes: an S through the centre, each half
      // offset toward the side its arm dust continues from.
      for (let s = -1; s <= 1; s += 2) {
        for (let t = 0.12; t < 1; t += 0.05) {
          const along = s * t * R_BAR;
          const across = s * (0.01 + 0.016 * t);
          const r = Math.hypot(along, across);
          const th = Math.atan2(across, along) + BAR_ANGLE;
          putStreak(sprDust, r, th, BAR_ANGLE, 0.01, 0.004, 0.28 * (0.4 + 0.6 * t));
        }
      }

      // 10. A sprinkle of foreground starlight so the dust reads translucent.
      g.globalCompositeOperation = 'lighter';
      sprinkleField(700, 0.4);

      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      return tex;
    };

    const tex = buildTexture();

    // Gentle live glow over the core so the 8-bit texture still blooms.
    const spCore = makeSprite([
      [0, 'rgba(255,243,220,0.55)'],
      [0.35, 'rgba(255,226,184,0.18)'],
      [1, 'rgba(255,226,184,0)'],
    ]);

    // --- Live star populations ------------------------------------------------
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

    /** Weighted choice among the arms whose radial range contains r. */
    const armFor = (r: number): Arm | null => {
      let sum = 0;
      for (const a of ARMS) if (r >= a.r0 && r <= a.r1) sum += a.lum;
      if (!sum) return null;
      let x = Math.random() * sum;
      for (const a of ARMS) {
        if (r < a.r0 || r > a.r1) continue;
        x -= a.lum;
        if (x <= 0) return a;
      }
      return null;
    };

    const pts: GalaxyStar[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const u = Math.random();
      let r: number;
      let theta: number;
      let z: number;
      let col: string;
      let size: number;
      let a: number;

      if (u < 0.11) {
        // Central bulge: a dense, slightly puffy spheroid of old warm stars.
        r = Math.pow(Math.random(), 2.2) * 0.16;
        theta = rnd(0, TAU);
        z = gauss() * 0.045 * (1 - r * 2.5);
        col = Math.random() < 0.06 ? '255,180,140' : pick(BULGE);
        size = rnd(0.35, 1) * dpr;
        a = rnd(0.25, 0.55);
      } else if (u < 0.21) {
        // The bar.
        const along = gauss() * R_BAR;
        const across = gauss() * R_BAR * 0.3;
        r = Math.hypot(along, across);
        theta = Math.atan2(across, along) + BAR_ANGLE;
        z = gauss() * 0.015;
        col = pick(BULGE);
        size = rnd(0.35, 1.1) * dpr;
        a = rnd(0.24, 0.55);
      } else if (u < 0.29) {
        // Sparse stellar halo: old faint stars in a puffy spheroid.
        r = 0.2 + Math.pow(Math.random(), 1.6) * 0.85;
        theta = rnd(0, TAU);
        z = gauss() * 0.4 * r;
        col = Math.random() < 0.5 ? pick(BULGE) : pick(DISC);
        size = rnd(0.3, 0.8) * dpr;
        a = rnd(0.06, 0.22);
      } else {
        // Disc stars: most trace the arms, the rest are inter-arm field.
        r = 0.08 + Math.pow(Math.random(), 1.25) * 0.97;
        const arm = Math.random() < 0.68 ? armFor(r) : null;
        z = gauss() * 0.013 * (1 - r * 0.5);
        if (arm) {
          const wAng = armWidth(r, arm.major) / Math.max(r, 0.12);
          const sp = gauss();
          theta = armTheta(r, arm.off) + sp * wAng;
          const ridge = arm.major && Math.abs(sp) < 0.5;
          if (ridge && r > 0.24 && Math.random() < 0.7) {
            col = pick(YOUNG); // hot young stars light up the arm ridges
          } else if (Math.random() < 0.05) {
            col = '255,185,145'; // scattered red giants
          } else {
            col = pick(DISC);
          }
          size = rnd(0.35, 1.45) * dpr * (ridge ? 1.15 : 1);
          a = rnd(0.25, 0.8) * (0.55 + 0.45 * arm.lum);
        } else {
          theta = rnd(0, TAU);
          col = Math.random() < 0.05 ? '255,185,145' : pick(DISC);
          size = rnd(0.3, 1.1) * dpr;
          a = rnd(0.1, 0.4);
        }
      }

      pts.push({ r, theta, z, col, size, a, tw: Math.random() * TAU, tws: rnd(0.6, 2.2) });
    }

    // A handful of bright "hero" stars with visible glow.
    const heroKinds: Array<[RGB, string]> = [
      [[168, 196, 255], '235,242,255'],
      [[255, 238, 214], '255,248,236'],
      [[255, 204, 150], '255,228,196'],
    ];
    const heroSprites = heroKinds.map(([c]) => softDot(c));
    const heroes: HeroStar[] = [];
    for (let i = 0; i < 44; i++) {
      const k = Math.random() < 0.5 ? 0 : Math.random() < 0.6 ? 1 : 2;
      heroes.push({
        r: 0.05 + Math.pow(Math.random(), 1.3),
        theta: rnd(0, TAU),
        z: gauss() * 0.05,
        spr: heroSprites[k],
        col: heroKinds[k][1],
        core: rnd(0.7, 1.5) * dpr,
        glow: rnd(3, 9) * dpr,
        a: rnd(0.4, 0.9),
        tw: Math.random() * TAU,
        tws: rnd(0.4, 1.4),
      });
    }

    let galRot = 0;
    let lastT = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      galRot -= dt * ROT_SPEED;
      ctx.clearRect(0, 0, W, H);

      // The baked disc, rotated in its own plane, then inclined and tilted.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(TILT);
      ctx.scale(1, INCL);
      ctx.rotate(galRot);
      const s = R * EDGE;
      ctx.drawImage(tex, -s, -s, s * 2, s * 2);
      ctx.restore();

      ctx.globalCompositeOperation = 'lighter';

      // Breathing bloom over the core.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(TILT);
      ctx.scale(1, 0.74);
      const cs = R * 0.3;
      ctx.globalAlpha = 0.4 + 0.08 * Math.sin(now * 0.00035);
      ctx.drawImage(spCore, -cs, -cs, cs * 2, cs * 2);
      ctx.restore();

      for (const p of pts) {
        const [X, Y] = project(p.r, p.theta + galRot, p.z);
        const tw = 0.75 + 0.25 * Math.sin(now * 0.001 * p.tws + p.tw);
        ctx.globalAlpha = p.a * tw;
        ctx.fillStyle = `rgb(${p.col})`;
        ctx.beginPath();
        ctx.arc(X, Y, p.size, 0, TAU);
        ctx.fill();
      }

      for (const h of heroes) {
        const [X, Y] = project(h.r, h.theta + galRot, h.z);
        const tw = 0.7 + 0.3 * Math.sin(now * 0.001 * h.tws + h.tw);
        ctx.globalAlpha = h.a * tw;
        ctx.drawImage(h.spr, X - h.glow, Y - h.glow, h.glow * 2, h.glow * 2);
        ctx.fillStyle = `rgb(${h.col})`;
        ctx.beginPath();
        ctx.arc(X, Y, h.core, 0, TAU);
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
