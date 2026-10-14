import { useEffect, type RefObject } from 'react';
import type * as ThreeTypes from 'three';
import { isCoarsePointer, prefersReducedMotion, runAnimation, type Animation } from '../lib/motion';

// A real-time 3D Milky Way, seen from ~45 degrees above the disc and spinning
// about its own axis. Scrolling the page flies the camera closer.
// - The disc is a face-on Cycles render (Blender), baked to a texture and laid
//   on a 3D plane, so the tilt is true perspective rather than a squashed photo.
// - Stars are real 3D points from the same render's star catalogue: they stay
//   sharp and show parallax as the camera moves in.
// - three.js is imported lazily so it never delays first paint.
// Assets: public/space/milkyway (galaxy_{2k,4k,8k}.webp, stars_{d,m}.bin, stars.json).

type Three = typeof ThreeTypes;

interface StarManifest {
  desktop: number;
  mobile: number;
  scale: [number, number, number];
}

const ASSETS = `${import.meta.env.BASE_URL}space/milkyway`;
const BG = 0x04060e; // --bg; the canvas is opaque and matches the page
const EXTENT = 130; // kly covered by the disc texture (matches the Blender bake)
const FOV = 40;
const START_FIT_WIDTH = 92; // kly of galaxy spanning the screen width at the top of the page
const END_DISTANCE = 26; // camera distance (kly) at the bottom of the page
const START_ELEVATION = 45; // degrees above the galactic plane
const END_ELEVATION = 36;
const SPIN_SECONDS = 180; // one full turn, clockwise as seen from the north
const SCROLL_EASING = 0.06; // fraction of the remaining zoom covered per frame
const DISC_ALPHA = 0.6; // keep the hero copy readable over the disc
const BULGE_ALPHA = 0.25;
const STAR_BRIGHTNESS = 1.1;
const FADE_IN = 1.4; // seconds
const MIN_FRAME_MS = 1000 / 60 - 2; // high-refresh screens don't need more than ~60 redraws/s

const vertexShader = /* glsl */ `
  attribute vec4 starColor;
  uniform float uScale;
  uniform float uPixelRatio;
  uniform float uBrightness;
  varying vec3 vColor;
  varying float vIntensity;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float b = starColor.a;
    float worldSize = mix(0.035, 0.16, b);            // glow diameter in kly
    float px = worldSize * uScale / max(-mv.z, 0.001);
    float size = clamp(px, 1.0, 40.0);
    float energy = px < 1.0 ? px * px : 1.0;           // sub-pixel stars keep their total light
    vIntensity = (0.12 + 0.88 * b * b) * energy * uBrightness;
    vColor = starColor.rgb;
    gl_PointSize = size * uPixelRatio;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vIntensity;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r2 = dot(c, c) * 4.0;
    float glow = exp(-r2 * 7.0) + 0.12 * exp(-r2 * 1.5);
    if (glow < 0.004) discard;
    gl_FragColor = vec4(vColor * vIntensity * glow, 1.0);
  }
`;

function radialTexture(THREE: Three, stops: [number, string][]) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([at, color]) => gradient.addColorStop(at, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function scrollProgress(): number {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}

/** Builds the scene on `canvas` and starts it; returns a teardown function. */
function startGalaxy(THREE: Three, canvas: HTMLCanvasElement): () => void {
  let renderer: ThreeTypes.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  } catch {
    return () => {}; // no WebGL: nebulae and starfield still cover the backdrop
  }
  const reduced = prefersReducedMotion();
  const small = isCoarsePointer() || window.innerWidth < 768;

  let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(BG, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 4000);
  const galaxy = new THREE.Group();
  scene.add(galaxy);
  const disposables: { dispose(): void }[] = [];
  let anim: Animation | null = null;
  let shownAt = 0; // when the disc texture arrived, for the fade-in

  // --- the disc: face-on Cycles bake on a plane (galactic plane = XZ, north = +Y)
  const discMaterial = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0,
  });
  const discGeometry = new THREE.PlaneGeometry(EXTENT, EXTENT).rotateX(-Math.PI / 2);
  galaxy.add(new THREE.Mesh(discGeometry, discMaterial));
  disposables.push(discMaterial, discGeometry);

  // small texture first (fast), then the sharp one this screen can use
  const screenPx = Math.max(window.screen.width, window.screen.height) * (window.devicePixelRatio || 1);
  const sharp = screenPx >= 2560 && renderer.capabilities.maxTextureSize >= 8192 ? '8k' : '4k';
  const sizes = small ? ['2k'] : ['2k', sharp];
  let bestLoaded = -1;
  const loader = new THREE.TextureLoader();
  sizes.forEach((size, rank) =>
    loader.load(`${ASSETS}/galaxy_${size}.webp`, (texture) => {
      if (rank < bestLoaded) {
        texture.dispose(); // a sharper texture already arrived
        return;
      }
      bestLoaded = rank;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // crisp at the oblique angle
      discMaterial.map?.dispose();
      discMaterial.map = texture;
      discMaterial.needsUpdate = true;
      if (!shownAt) shownAt = performance.now();
      anim?.redraw();
    }),
  );

  // --- the bulge rises out of the plane: a soft warm glow that always faces the camera
  const bulgeTexture = radialTexture(THREE, [
    [0, 'rgba(255,236,205,0.85)'],
    [0.18, 'rgba(255,214,160,0.45)'],
    [0.45, 'rgba(240,170,110,0.12)'],
    [1, 'rgba(0,0,0,0)'],
  ]);
  const bulgeMaterial = new THREE.SpriteMaterial({
    map: bulgeTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0,
  });
  const bulge = new THREE.Sprite(bulgeMaterial);
  bulge.scale.set(16, 16, 1);
  scene.add(bulge);
  disposables.push(bulgeTexture, bulgeMaterial);

  // --- stars: real 3D points from the catalogue
  const starUniforms = {
    uScale: { value: 1 },
    uPixelRatio: { value: pixelRatio },
    uBrightness: { value: 0 },
  };
  const starMaterial = new THREE.ShaderMaterial({
    uniforms: starUniforms,
    vertexShader,
    fragmentShader,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });
  disposables.push(starMaterial);
  fetch(`${ASSETS}/stars.json`)
    .then((response) => response.json() as Promise<StarManifest>)
    .then((manifest) =>
      fetch(`${ASSETS}/${small ? 'stars_m' : 'stars_d'}.bin`)
        .then((response) => response.arrayBuffer())
        .then((buffer) => {
          const count = small ? manifest.mobile : manifest.desktop;
          const quantised = new Int16Array(buffer, 0, count * 3);
          const colours = new Uint8Array(buffer, count * 6, count * 4);
          const positions = new Float32Array(count * 3);
          const [sx, sy, sz] = manifest.scale.map((s) => s / 32767);
          for (let i = 0; i < count; i++) {
            // galaxy (x, y, z) -> three.js (x, z, -y): the galactic north pole points up
            positions[i * 3] = quantised[i * 3] * sx;
            positions[i * 3 + 1] = quantised[i * 3 + 2] * sz;
            positions[i * 3 + 2] = -quantised[i * 3 + 1] * sy;
          }
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute('starColor', new THREE.BufferAttribute(colours, 4, true));
          galaxy.add(new THREE.Points(geometry, starMaterial));
          disposables.push(geometry);
          anim?.redraw();
        }),
    )
    .catch(() => {
      /* the disc alone still reads as the galaxy */
    });

  // --- camera: flies closer as the page scrolls, eased
  let startDistance = 80;
  let target = scrollProgress();
  let progress = target;

  const resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    startDistance = THREE.MathUtils.clamp(START_FIT_WIDTH / (viewHeight * camera.aspect), 60, 170);
    starUniforms.uScale.value = height / viewHeight; // pixels per kly at distance 1
    anim?.redraw();
  };

  const placeCamera = (p: number) => {
    const distance = startDistance * Math.pow(END_DISTANCE / startDistance, p);
    const elevation = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(START_ELEVATION, END_ELEVATION, p));
    camera.position.set(0, distance * Math.sin(elevation), distance * Math.cos(elevation));
    camera.lookAt(0, 0, 0);
  };

  const onScroll = () => {
    target = scrollProgress();
    anim?.redraw();
  };

  // --- render loop (lowers resolution if the machine struggles)
  let lastT = performance.now();
  let lastRender = -Infinity;
  let slowFrames = 0;
  const draw = (now: number) => {
    if (!reduced && now - lastRender < MIN_FRAME_MS) return;
    lastRender = now;
    // `dt` is clamped so a tab resumed from the background doesn't jump the disc forward.
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;

    if (!reduced) galaxy.rotation.y -= (dt * 2 * Math.PI) / SPIN_SECONDS;
    progress = reduced ? target : progress + (target - progress) * SCROLL_EASING;
    placeCamera(progress);

    const fade = !shownAt ? 0 : reduced ? 1 : Math.min(1, (now - shownAt) / 1000 / FADE_IN);
    discMaterial.opacity = DISC_ALPHA * fade;
    bulgeMaterial.opacity = BULGE_ALPHA * fade;
    starUniforms.uBrightness.value = STAR_BRIGHTNESS * fade;
    renderer.render(scene, camera);

    slowFrames = dt > 1 / 40 ? slowFrames + 1 : Math.max(slowFrames - 1, 0);
    if (slowFrames > 45 && pixelRatio > 1) {
      pixelRatio = Math.max(pixelRatio - 0.25, 1);
      renderer.setPixelRatio(pixelRatio);
      starUniforms.uPixelRatio.value = pixelRatio;
      resize();
      slowFrames = 0;
    }
  };

  resize();
  placeCamera(progress);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resize);
  anim = runAnimation(draw);

  return () => {
    anim?.stop();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', resize);
    discMaterial.map?.dispose();
    disposables.forEach((item) => item.dispose());
    renderer.dispose();
  };
}

/**
 * Renders the Milky Way backdrop on `canvasRef`: a real-time 3D galaxy seen at
 * ~45 degrees, spinning slowly, with the camera drawing closer as you scroll.
 */
export function useGalaxy(canvasRef: RefObject<HTMLCanvasElement>): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let stop = () => {};
    import('three')
      .then((THREE) => {
        if (!disposed) stop = startGalaxy(THREE, canvas);
      })
      .catch(() => {
        /* nebulae and starfield still cover the backdrop */
      });
    return () => {
      disposed = true;
      stop();
    };
  }, [canvasRef]);
}
