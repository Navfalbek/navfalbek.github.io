import { useRef, type RefObject } from 'react';
import { useGalaxy } from '../../hooks/useGalaxy';
import { useNebula } from '../../hooks/useNebula';
import { useStarfield } from '../../hooks/useStarfield';
import styles from './Background.module.css';

interface BackgroundProps {
  galaxyLayerRef: RefObject<HTMLDivElement>;
  nebulaLayerRef: RefObject<HTMLDivElement>;
}

/**
 * The full-viewport cosmic backdrop: animated galaxy, procedural nebulae,
 * warp-speed starfield and a vignette. The two layer wrappers are driven by
 * `useScrollScene` (in App) through the forwarded refs.
 */
export function Background({ galaxyLayerRef, nebulaLayerRef }: BackgroundProps) {
  const galaxyCanvasRef = useRef<HTMLCanvasElement>(null);
  const nebulaCanvasRef = useRef<HTMLCanvasElement>(null);
  const starCanvasRef = useRef<HTMLCanvasElement>(null);

  useGalaxy(galaxyCanvasRef);
  useNebula(nebulaCanvasRef);
  useStarfield(starCanvasRef);

  return (
    <>
      <div className={styles.galaxyLayer} ref={galaxyLayerRef}>
        <canvas className={styles.galaxyCanvas} ref={galaxyCanvasRef} />
      </div>

      <div className={styles.nebulaLayer} ref={nebulaLayerRef}>
        <canvas className={styles.nebulaCanvas} ref={nebulaCanvasRef} />
      </div>

      <canvas className={styles.starCanvas} ref={starCanvasRef} />
      <div className={styles.vignette} />
    </>
  );
}
