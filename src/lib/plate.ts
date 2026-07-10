/**
 * Loaders for AI-generated astrophotography "plates" — square images of a
 * galaxy or nebula on a pure black background. `loadPlate` decodes a plate
 * into an additive sprite: black becomes transparent (alpha follows the
 * brightest channel, colors are un-premultiplied so additive drawing keeps
 * the original look) and a radial mask fades the square's edges to nothing.
 */

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}

const smoothstep = (e0: number, e1: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * @param src image URL (square, subject on pure black)
 * @param edgeStart normalized radius (0..1, of the half-size) where the
 *   radial fade-out begins; everything past radius 1 is fully masked.
 */
export async function loadPlate(src: string, edgeStart = 0.86): Promise<HTMLCanvasElement> {
  const img = await loadImage(src);
  const N = Math.min(img.width, img.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = N;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, N, N);

  const im = ctx.getImageData(0, 0, N, N);
  const d = im.data;
  const half = N / 2;

  for (let y = 0; y < N; y++) {
    const dy = (y - half) / half;
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4;
      const m = Math.max(d[i], d[i + 1], d[i + 2]);
      // Kill the near-black noise floor left by compression.
      if (m < 6) {
        d[i + 3] = 0;
        continue;
      }
      const dx = (x - half) / half;
      const edge = 1 - smoothstep(edgeStart, 1, Math.hypot(dx, dy));
      if (edge <= 0) {
        d[i + 3] = 0;
        continue;
      }
      // alpha = brightness; colors normalized so that premultiplying by
      // alpha during draw reproduces the source pixel exactly.
      const scale = 255 / m;
      d[i] = Math.min(255, d[i] * scale);
      d[i + 1] = Math.min(255, d[i + 1] * scale);
      d[i + 2] = Math.min(255, d[i + 2] * scale);
      d[i + 3] = m * edge;
    }
  }
  ctx.putImageData(im, 0, 0);
  return canvas;
}
