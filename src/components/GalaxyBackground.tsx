import {useRouter} from 'next/router';
import {FC, memo, useEffect, useRef} from 'react';

/**
 * Full-page background: a real-time Milky Way, viewed at ~45 degrees and spinning continuously.
 * Scrolling the page flies the camera closer.
 *
 * - The disk is a face-on Cycles render (Blender), baked into a texture and laid on a 3D plane.
 * - Stars are real 3D points (a subset of the 2.6M-star catalogue used for the render), so they
 *   stay sharp and show parallax as the camera moves in.
 * - three.js is loaded lazily so it never delays the rest of the page.
 *
 * Assets live in public/galaxy (made by the scripts in the Blender project's galaxy/ folder).
 */

type Three = typeof import('three');

interface StarManifest {
  desktop: number;
  mobile: number;
  scale: [number, number, number];
  extent: number;
}

const EXTENT = 130; // kly covered by the disk texture (matches the Blender bake)
const FOV = 40;
const START_FIT_WIDTH = 92; // kly of galaxy spanning the screen width at the top of the page
const END_DISTANCE = 26; // camera distance (kly) at the bottom of the page
const START_ELEVATION = 45; // degrees above the galactic plane
const END_ELEVATION = 36;
const SPIN_SECONDS = 180; // one full turn
const SCROLL_EASING = 0.06; // fraction of the remaining zoom covered per frame (at ~60 fps)
const MIN_FRAME_MS = 1000 / 60 - 2; // cap at ~60 fps: high-refresh screens don't need 165 redraws/s

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

const radialTexture = (THREE: Three, stops: [number, string][]) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([at, color]) => gradient.addColorStop(at, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const startGalaxy = (THREE: Three, container: HTMLElement, root: string): (() => void) => {
  let renderer: import('three').WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({antialias: false, powerPreference: 'high-performance'});
  } catch {
    return () => undefined; // no WebGL: the page simply keeps its black background
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.matchMedia('(max-width: 767px)').matches;

  let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 1);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 4000);
  const galaxy = new THREE.Group();
  scene.add(galaxy);
  const disposables: {dispose: () => void}[] = [];

  // --- the disk: face-on Cycles bake on a plane (galaxy plane = XZ, north pole = +Y)
  const diskMaterial = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0,
  });
  const diskGeometry = new THREE.PlaneGeometry(EXTENT, EXTENT).rotateX(-Math.PI / 2);
  galaxy.add(new THREE.Mesh(diskGeometry, diskMaterial));
  disposables.push(diskMaterial, diskGeometry);

  // small texture first (fast), then the sharp one for this screen
  const loader = new THREE.TextureLoader();
  const maxTexture = renderer.capabilities.maxTextureSize;
  const screenPx = Math.max(window.screen.width, window.screen.height) * (window.devicePixelRatio || 1);
  const sizes = small ? ['2k'] : ['2k', screenPx >= 2560 && maxTexture >= 8192 ? '8k' : '4k'];
  let bestLoaded = -1;
  sizes.forEach((size, rank) =>
    loader.load(`${root}/galaxy_${size}.webp`, texture => {
      if (rank < bestLoaded) {
        texture.dispose(); // a sharper texture already arrived
        return;
      }
      bestLoaded = rank;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // crisp at the oblique angle
      diskMaterial.map?.dispose();
      diskMaterial.map = texture;
      diskMaterial.needsUpdate = true;
      container.style.opacity = '1';
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
    opacity: 0.5,
  });
  const bulge = new THREE.Sprite(bulgeMaterial);
  bulge.scale.set(16, 16, 1);
  scene.add(bulge);
  disposables.push(bulgeTexture, bulgeMaterial);

  // --- stars: real 3D points from the catalogue
  const starUniforms = {
    uScale: {value: 1},
    uPixelRatio: {value: pixelRatio},
    uBrightness: {value: 0},
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
  fetch(`${root}/stars.json`)
    .then(response => response.json() as Promise<StarManifest>)
    .then(manifest =>
      fetch(`${root}/${small ? 'stars_m' : 'stars_d'}.bin`)
        .then(response => response.arrayBuffer())
        .then(buffer => {
          const count = small ? manifest.mobile : manifest.desktop;
          const quantised = new Int16Array(buffer, 0, count * 3);
          const colours = new Uint8Array(buffer, count * 6, count * 4);
          const positions = new Float32Array(count * 3);
          const [sx, sy, sz] = manifest.scale.map(s => s / 32767);
          for (let i = 0; i < count; i++) {
            // galaxy (x, y, z) -> three.js (x, z, -y): galactic north pole points up
            positions[i * 3] = quantised[i * 3] * sx;
            positions[i * 3 + 1] = quantised[i * 3 + 2] * sz;
            positions[i * 3 + 2] = -quantised[i * 3 + 1] * sy;
          }
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute('starColor', new THREE.BufferAttribute(colours, 4, true));
          galaxy.add(new THREE.Points(geometry, starMaterial));
          disposables.push(geometry);
        }),
    )
    .catch(() => undefined);

  // --- distant background stars (static, not part of the galaxy)
  const bgCount = small ? 1500 : 4000;
  const bgPositions = new Float32Array(bgCount * 3);
  const bgColours = new Uint8Array(bgCount * 4);
  for (let i = 0; i < bgCount; i++) {
    const u = Math.random() * 2 - 1;
    const phi = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    bgPositions.set([1500 * s * Math.cos(phi), 1500 * u, 1500 * s * Math.sin(phi)], i * 3);
    const warm = Math.random();
    bgColours.set([255, 235 + 20 * warm, 215 + 40 * warm, 40 + Math.random() * 90], i * 4);
  }
  const bgGeometry = new THREE.BufferGeometry();
  bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
  bgGeometry.setAttribute('starColor', new THREE.BufferAttribute(bgColours, 4, true));
  const bgUniforms = {uScale: {value: 1}, uPixelRatio: {value: pixelRatio}, uBrightness: {value: 0.9}};
  const bgMaterial = new THREE.ShaderMaterial({
    uniforms: bgUniforms,
    vertexShader,
    fragmentShader,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });
  scene.add(new THREE.Points(bgGeometry, bgMaterial));
  disposables.push(bgGeometry, bgMaterial);

  // --- camera: zoom with scroll, eased
  let startDistance = 80;
  let target = 0;
  let progress = 0;

  const scrollProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
  };

  const resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    startDistance = THREE.MathUtils.clamp(START_FIT_WIDTH / (viewHeight * camera.aspect), 60, 170);
    const scale = height / viewHeight; // pixels per kly at distance 1
    starUniforms.uScale.value = scale;
    bgUniforms.uScale.value = scale;
  };

  const placeCamera = (p: number) => {
    const distance = startDistance * Math.pow(END_DISTANCE / startDistance, p);
    const elevation = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(START_ELEVATION, END_ELEVATION, p));
    camera.position.set(0, distance * Math.sin(elevation), distance * Math.cos(elevation));
    camera.lookAt(0, 0, 0);
  };

  const onScroll = () => {
    target = scrollProgress();
  };

  // --- render loop (lowers resolution if the machine struggles)
  const clock = new THREE.Clock();
  let raf = 0;
  let slowFrames = 0;
  let fadeIn = 0;
  let lastRender = -Infinity;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (now - lastRender < MIN_FRAME_MS) return;
    lastRender = now;
    const dt = Math.min(clock.getDelta(), 0.1);
    if (!reduceMotion) galaxy.rotation.y -= (dt * 2 * Math.PI) / SPIN_SECONDS; // clockwise seen from the north
    progress = reduceMotion ? target : progress + (target - progress) * SCROLL_EASING;
    placeCamera(progress);

    fadeIn = Math.min(fadeIn + dt / 1.5, 1);
    if (diskMaterial.map) diskMaterial.opacity = fadeIn;
    starUniforms.uBrightness.value = 1.4 * fadeIn;
    renderer.render(scene, camera);

    slowFrames = dt > 1 / 40 ? slowFrames + 1 : Math.max(slowFrames - 1, 0);
    if (slowFrames > 45 && pixelRatio > 1) {
      pixelRatio = Math.max(pixelRatio - 0.25, 1);
      renderer.setPixelRatio(pixelRatio);
      starUniforms.uPixelRatio.value = pixelRatio;
      bgUniforms.uPixelRatio.value = pixelRatio;
      resize();
      slowFrames = 0;
    }
  };

  resize();
  target = progress = scrollProgress();
  placeCamera(progress);
  raf = requestAnimationFrame(frame);
  window.addEventListener('scroll', onScroll, {passive: true});
  window.addEventListener('resize', resize);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', resize);
    diskMaterial.map?.dispose();
    disposables.forEach(item => item.dispose());
    renderer.dispose();
    renderer.domElement.remove();
  };
};

const GalaxyBackground: FC = memo(() => {
  const mountRef = useRef<HTMLDivElement>(null);
  const {basePath} = useRouter();

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    let disposed = false;
    let stop: () => void = () => undefined;
    import('three')
      .then(THREE => {
        if (!disposed) stop = startGalaxy(THREE, container, `${basePath}/galaxy`);
      })
      .catch(() => undefined);
    return () => {
      disposed = true;
      stop();
    };
  }, [basePath]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-black">
      <div className="h-full w-full opacity-0 transition-opacity duration-1000" ref={mountRef} />
      {/* soft vignette keeps text readable over the brightest parts */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.5)_100%)]" />
    </div>
  );
});

GalaxyBackground.displayName = 'GalaxyBackground';
export default GalaxyBackground;
